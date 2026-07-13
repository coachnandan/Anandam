export const createMockSupabaseClient = () => {
  const store = {
    members: [],
    attendance: [],
    memberships: []
  };

  return {
    from: (table) => {
      return {
        select: (columns) => ({
          eq: (field, value) => ({
            single: async () => {
              const item = store[table].find(i => i[field] === value);
              return { data: item || null, error: null };
            },
            async then(resolve) {
              const items = store[table].filter(i => i[field] === value);
              resolve({ data: items, error: null });
            }
          }),
          is: (field, value) => ({
            order: async () => {
              const items = store[table].filter(i => i[field] === value);
              return { data: items, error: null };
            }
          }),
          order: async () => {
            return { data: store[table], error: null };
          },
          async then(resolve) {
            resolve({ data: store[table], error: null });
          }
        }),
        insert: (data) => ({
          select: () => ({
            single: async () => {
              const newRecord = { ...data[0], id: Math.random().toString() };
              store[table].push(newRecord);
              return { data: newRecord, error: null };
            }
          })
        }),
        update: (data) => ({
          eq: (field, value) => ({
            select: () => ({
              single: async () => {
                const index = store[table].findIndex(i => i[field] === value);
                if (index > -1) {
                  store[table][index] = { ...store[table][index], ...data };
                  return { data: store[table][index], error: null };
                }
                return { data: null, error: { message: 'Not found' } };
              }
            })
          })
        }),
        delete: () => ({
          eq: async (field, value) => {
            const index = store[table].findIndex(i => i[field] === value);
            if (index > -1) {
               store[table].splice(index, 1);
            }
            return { error: null };
          }
        })
      };
    }
  };
};
