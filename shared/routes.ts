import { z } from 'zod';
import { insertUserSchema, users } from './schema';

export const api = {
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  status: {
    get: {
      method: 'GET' as const,
      path: '/api/status',
      responses: {
        200: z.object({
          status: z.string(),
          uptime: z.number(),
          activeUsers: z.number(),
        }),
      },
    }
  }
};
