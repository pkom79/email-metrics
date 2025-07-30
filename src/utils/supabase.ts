// Simple Supabase client configuration
// Note: In a real project, these would be environment variables

export const supabaseConfig = {
  url: 'http://localhost:54321', // Local Supabase URL
  anonKey: 'your_anon_key_here' // This would be the real anon key
};

// Create a simple client interface for development
export const createSupabaseClient = () => {
  return {
    channel: (name: string) => ({
      on: (event: string, callback: (payload: any) => void) => {
        // Mock implementation for development
        console.log(`Subscribed to ${event} on ${name}`);
        return { unsubscribe: () => console.log(`Unsubscribed from ${name}`) };
      },
      subscribe: () => console.log('Channel subscribed')
    }),
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    })
  };
};
