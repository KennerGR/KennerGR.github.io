import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Define the response types based on the schema and route responses
// Since we don't have the types exported from routes.ts yet in the context provided,
// we will infer them based on the routes_manifest.

export function useSystemStatus() {
  return useQuery({
    queryKey: [api.status.get.path],
    queryFn: async () => {
      const res = await fetch(api.status.get.path);
      if (!res.ok) throw new Error("Failed to fetch system status");
      // Using the Zod schema from api definition for validation
      const data = await res.json();
      return api.status.get.responses[200].parse(data);
    },
    refetchInterval: 5000, // Live updates every 5s
  });
}

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      return api.users.list.responses[200].parse(data);
    },
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      const url = api.users.get.path.replace(':id', id.toString());
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      return api.users.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}
