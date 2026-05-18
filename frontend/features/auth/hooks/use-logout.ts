import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { logoutAccount } from "../services/logout";
import { ME_QUERY_KEY } from "@/features/auth/hooks/use-me";
import { MY_INFO_QUERY_KEY } from "@/features/user/hooks/use-my-info";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function logout() {
    await logoutAccount();

    await queryClient.cancelQueries({ queryKey: ME_QUERY_KEY });
    queryClient.setQueryData(ME_QUERY_KEY, null);

    await queryClient.cancelQueries({ queryKey: MY_INFO_QUERY_KEY });
    queryClient.setQueryData(MY_INFO_QUERY_KEY, null);

    router.replace("/");
  }

  return { logout };
}