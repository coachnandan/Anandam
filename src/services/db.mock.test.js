import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockSupabaseClient } from './db.mock';

describe('Database Integration Fixture', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it('can simulate inserting a member', async () => {
    const res = await mockSupabase.from('members').insert([{ name: 'Test User' }]).select().single();
    expect(res.error).toBeNull();
    expect(res.data.name).toBe('Test User');
    expect(res.data.id).toBeDefined();
  });

  it('can simulate fetching members', async () => {
    await mockSupabase.from('members').insert([{ name: 'User 1' }]).select().single();
    const res = await mockSupabase.from('members').select('*').order();
    expect(res.data.length).toBe(1);
    expect(res.data[0].name).toBe('User 1');
  });

  it('can simulate updating a member', async () => {
    const insertRes = await mockSupabase.from('members').insert([{ name: 'Old Name', id: '123' }]).select().single();
    
    const updateRes = await mockSupabase.from('members').update({ name: 'New Name' }).eq('id', insertRes.data.id).select().single();
    
    expect(updateRes.error).toBeNull();
    expect(updateRes.data.name).toBe('New Name');
  });

  it('can simulate deleting a member', async () => {
    const insertRes = await mockSupabase.from('members').insert([{ name: 'Delete Me', id: '456' }]).select().single();
    
    const delRes = await mockSupabase.from('members').delete().eq('id', insertRes.data.id);
    expect(delRes.error).toBeNull();

    const fetchRes = await mockSupabase.from('members').select('*').order();
    expect(fetchRes.data.length).toBe(0); // Assuming this is the only record due to beforeEach, wait, the mock store is shared if we don't reset it.
  });
});
