import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, MessageSquare, Key, Bell, Shield, Save, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext';

export default function Settings() {
  const { settingsConfig, saveSettingsConfig } = useAppContext();
  const [apiProvider, setApiProvider] = useState('twilio');
  const [isSaved, setIsSaved] = useState(false);

  const [settings, setSettings] = useState({
    welcomeMsg: true,
    renewalAlert: true,
    expiryAlert: true,
    phoneId: '109283748293748',
    twilioSid: 'AC8a2c1b4d3e5f6g7h8i9j0k1l2m3n4o5p',
    fromNumber: 'whatsapp:+14155238886',
    cronSchedule: '0 9 * * *'
  });

  useEffect(() => {
    if (settingsConfig) {
      setSettings(settingsConfig);
    }
  }, [settingsConfig]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (saveSettingsConfig) {
      const res = await saveSettingsConfig(settings);
      if (res?.success !== false) {
        setIsSaved(true);
        toast.success('Sanctuary system settings updated successfully in Supabase!');
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        toast.error('Failed to save settings: ' + (res?.error?.message || 'Unknown error'));
      }
    } else {
      setIsSaved(true);
      toast.success('Sanctuary system settings updated successfully!');
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-forest tracking-tight">System Settings</h1>
        <p className="text-muted mt-2 font-medium">Manage and refine WhatsApp configurations, automated triggers, and security options.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Automation Toggles */}
        <div className="lg:col-span-1 space-y-10">
          <div className="luxury-card p-8 sm:p-10 space-y-8 bg-white">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-forest shadow-sm">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-forest tracking-tight">Notification Triggers</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Automated message schedules</p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { key: 'welcomeMsg', label: 'Welcome Dispatcher', desc: 'Fires welcome WhatsApp message upon client registration.' },
                { key: 'renewalAlert', label: 'Renewal Reminders', desc: 'Sends automated WhatsApp notification on day 27 (3 days prior to expiration).' },
                { key: 'expiryAlert', label: 'Expiration Alert', desc: 'Automatically marks membership as expired and triggers warning on day 30+.' },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between p-4 bg-offwhite rounded-xl border border-beige/40">
                  <div className="space-y-1 pr-4">
                    <p className="text-xs font-bold text-forest">{item.label}</p>
                    <p className="text-[10px] text-muted font-medium leading-relaxed">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input 
                      type="checkbox" 
                      checked={settings[item.key]} 
                      onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-beige/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-beige/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="luxury-card p-8 sm:p-10 space-y-6 bg-white">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-forest shadow-sm">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-forest tracking-tight">Cron Services</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Automation schedules</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Expiry Sync Interval</label>
              <input
                type="text"
                value={settings.cronSchedule}
                onChange={(e) => setSettings({ ...settings, cronSchedule: e.target.value })}
                className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all text-xs"
              />
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest px-1">Standard 5-field cron syntax</p>
            </div>
          </div>
        </div>

        {/* Right Column: API & Integrations */}
        <div className="lg:col-span-2 space-y-10">
          <div className="luxury-card p-8 sm:p-10 space-y-10 bg-white">
            <div className="flex items-center justify-between border-b border-beige/40 pb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-forest shadow-sm">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-forest tracking-tight">API Provider Config</h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Connect CRM with WhatsApp</p>
                </div>
              </div>
              <div className="flex p-1 bg-offwhite rounded-xl border border-beige/50">
                {['twilio', 'cloudApi'].map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setApiProvider(prov)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all ${
                      apiProvider === prov 
                        ? 'bg-forest text-white shadow-md' 
                        : 'text-muted hover:text-forest'
                    }`}
                  >
                    {prov === 'twilio' ? 'Twilio API' : 'Cloud API'}
                  </button>
                ))}
              </div>
            </div>

            {apiProvider === 'twilio' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3 sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Twilio Account SID</label>
                  <input
                    type="text"
                    value={settings.twilioSid}
                    onChange={(e) => setSettings({ ...settings, twilioSid: e.target.value })}
                    className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all text-xs"
                  />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Twilio Secret Token</label>
                  <input
                    type="password"
                    value="••••••••••••••••••••••••••••••••"
                    readOnly
                    className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all text-xs"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Twilio Sender Number</label>
                  <input
                    type="text"
                    value={settings.fromNumber}
                    onChange={(e) => setSettings({ ...settings, fromNumber: e.target.value })}
                    className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    value={settings.phoneId}
                    onChange={(e) => setSettings({ ...settings, phoneId: e.target.value })}
                    className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all text-xs"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Cloud API Version</label>
                  <input
                    type="text"
                    defaultValue="v18.0"
                    className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all text-xs"
                  />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Permanent Access Token</label>
                  <input
                    type="password"
                    value="••••••••••••••••••••••••••••••••"
                    readOnly
                    className="w-full px-6 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-4 focus:ring-sage/10 transition-all text-xs"
                  />
                </div>
              </div>
            )}

            <div className="border-t border-beige/40 pt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSaved}
                className="flex items-center justify-center px-10 py-5 bg-forest text-white rounded-xl font-semibold uppercase tracking-widest text-[10px] hover:bg-forest-hover transition-all shadow-lg shadow-forest/20 active:scale-95"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Changes Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Sanctuary Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
