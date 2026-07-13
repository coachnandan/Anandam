import React, { useState } from 'react';
import { Bell, Send, Clock, CheckCircle, AlertTriangle, Search, MessageSquare, User, Calendar, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { getISTDisplayDate, getISTTimeString } from '../utils/dateUtils';

export default function Notifications() {
  const { notifications, customers, sendWhatsAppAlert, fetchData } = useAppContext();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedMsgType, setSelectedMsgType] = useState('Welcome');
  const [extraData, setExtraData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.warn('Please select a client to notify');
      return;
    }
    
    setIsSending(true);
    try {
      const parsedExtra = extraData ? JSON.parse(extraData) : {};
      await sendWhatsAppAlert(selectedClient, selectedMsgType, parsedExtra);
      toast.success('Notification trigger request successfully dispatched!');
      setExtraData('');
    } catch (err) {
      toast.error('Failed to dispatch notification: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Sent':
      case 'sent':
      case 'success':
        return <span className="px-3 py-1 bg-emerald/10 text-emerald border border-emerald/20 rounded-xl text-[9px] font-semibold uppercase tracking-widest">Sent</span>;
      case 'Failed':
      case 'failed':
        return <span className="px-3 py-1 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[9px] font-semibold uppercase tracking-widest">Failed</span>;
      default:
        return <span className="px-3 py-1 bg-gold/10 text-gold border border-gold/20 rounded-xl text-[9px] font-semibold uppercase tracking-widest">{status || 'Pending'}</span>;
    }
  };

  const filteredLogs = notifications.filter(note => {
    const clientName = note.clients?.name || '';
    const matchName = clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = (note.message_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchType;
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-forest tracking-tight">Notification Terminal</h1>
          <p className="text-muted mt-2 font-medium">Dispatch and track automated WhatsApp messages.</p>
        </div>
        <button 
          onClick={() => {
            fetchData();
            toast.info('Notification logs refreshed.');
          }}
          className="flex items-center justify-center p-4 bg-white border border-beige rounded-xl text-forest hover:bg-offwhite transition-all shadow-sm"
        >
          <RefreshCw size={16} className="mr-2 text-sage animate-spin-hover" />
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Form: Trigger Message */}
        <div className="lg:col-span-1 luxury-card bg-white p-8 sm:p-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-forest shadow-sm">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-forest tracking-tight">Manual Dispatch</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Trigger immediate WhatsApp alert</p>
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Recipient Client</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-5 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all"
                >
                  <option value="">Select Practitioner...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.contact})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Notification Type</label>
                <select
                  value={selectedMsgType}
                  onChange={(e) => setSelectedMsgType(e.target.value)}
                  className="w-full px-5 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all"
                >
                  <option value="Welcome">Welcome Message</option>
                  <option value="MembershipCreated">Membership Created</option>
                  <option value="Welcome Plan">Welcome Plan (Renewal)</option>
                  <option value="Renewal Confirmation">Renewal Confirmation</option>
                  <option value="Renewal Reminder">Renewal Reminder</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-forest uppercase tracking-[0.2em] px-1">Extra Data (JSON String, Optional)</label>
                <textarea
                  value={extraData}
                  onChange={(e) => setExtraData(e.target.value)}
                  placeholder='e.g. {"plan": "Annual Harmony", "expiry_date": "2027-05-28"}'
                  className="w-full px-5 py-4 bg-offwhite border border-beige rounded-xl font-bold text-forest outline-none focus:ring-2 focus:ring-sage/20 transition-all min-h-[100px] placeholder-muted/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || !selectedClient}
                className="w-full flex items-center justify-center py-5 px-6 rounded-xl shadow-xl shadow-forest/10 text-[10px] font-semibold text-white bg-forest hover:bg-forest-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em]"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Dispatch Alert
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Table: Notification Logs */}
        <div className="lg:col-span-2 luxury-card overflow-hidden bg-white">
          <div className="p-8 sm:p-10 border-b border-beige bg-offwhite/30 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <Bell size={18} className="text-sage" />
              <h3 className="text-xl font-bold text-forest tracking-tight">Transmission Logs</h3>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40" size={16} />
              <input
                type="text"
                placeholder="Search type or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-beige rounded-xl text-forest font-bold text-xs placeholder-muted/30 focus:ring-4 focus:ring-sage/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-offwhite/50 text-muted text-[10px] font-semibold uppercase tracking-[0.2em] border-b border-beige">
                  <th className="px-8 py-5">Recipient</th>
                  <th className="px-8 py-5">Message Type</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Sent Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/40">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-offwhite transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-xl bg-offwhite border border-beige flex items-center justify-center text-forest font-bold text-xs mr-3">
                            <User size={14} className="text-sage" />
                          </div>
                          <div>
                            <p className="font-bold text-forest text-sm leading-tight">{log.clients?.name || 'System Admin'}</p>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">{log.client_id?.slice(0, 8) || 'SYSTEM'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-forest text-sm leading-tight flex items-center">
                          <MessageSquare size={13} className="mr-2 text-gold shrink-0" />
                          {log.message_type}
                        </p>
                      </td>
                      <td className="px-8 py-6">{getStatusBadge(log.sent_status || log.status)}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end text-[10px] font-bold text-muted uppercase tracking-wider">
                          <Calendar size={11} className="mr-1 opacity-50" />
                          {new Date(log.sent_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })} &nbsp;
                          <Clock size={11} className="mr-1 opacity-50" />
                          {new Date(log.sent_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="w-16 h-16 bg-offwhite rounded-xl flex items-center justify-center mb-4 border border-beige/50 mx-auto">
                        <Bell size={24} className="text-beige" />
                      </div>
                      <p className="text-xs font-semibold text-forest uppercase tracking-widest">Clear logs</p>
                      <p className="text-[10px] text-muted font-medium mt-1">No alerts have been recorded in this view.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
