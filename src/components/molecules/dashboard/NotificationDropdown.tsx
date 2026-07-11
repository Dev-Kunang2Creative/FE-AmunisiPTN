"use client";

import { Bell, Check, CircleAlert, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetNotifications } from "@/http/notifications/get-notifications";
import { useGetUnreadCount } from "@/http/notifications/get-unread-count";
import { useMarkAsRead } from "@/http/notifications/mark-as-read";
import { useMarkAllAsRead } from "@/http/notifications/mark-all-as-read";

export default function NotificationDropdown() {
  const { data: session } = useSession();
  const token = session?.access_token || "";
  const router = useRouter();

  const { data: notificationsData, isLoading } = useGetNotifications({
    token,
    page: 1,
    perPage: 10,
  });
  const notifications = notificationsData?.data || [];

  const { data: unreadData } = useGetUnreadCount({ token });
  const unreadCount = unreadData?.data?.unread_count || 0;

  const markAsReadMutation = useMarkAsRead(token);
  const markAllAsReadMutation = useMarkAllAsRead(token);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read_at) {
      markAsReadMutation.mutate({ notification_id: notification.id });
    }

    if (notification.data?.ticket_report_id) {
      // Assuming navigation to ticket report details
      router.push(
        `/dashboard/ticket-report/${notification.data.ticket_report_id}`,
      );
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsReadMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="focus:outline-none">
        <button className="relative p-2 rounded-full bg-[#EDF5FF] hover:bg-blue-100 transition-colors shrink-0 text-gray-600">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-2" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
          <DropdownMenuLabel className="font-bold text-gray-800 p-0">
            Notifikasi
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Tandai semua dibaca
            </button>
          )}
        </div>

        <div className="flex flex-col max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-600">
                Belum ada notifikasi
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Notifikasi terbaru akan muncul di sini.
              </p>
            </div>
          ) : (
            notifications.map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer rounded-md ${
                  !notification.read_at ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  <div
                    className={`mt-0.5 rounded-full p-1.5 shrink-0 ${
                      !notification.read_at
                        ? "bg-blue-100 text-primary"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <CircleAlert className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p
                      className={`text-sm ${!notification.read_at ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                    >
                      {notification.data?.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {notification.data?.description}
                    </p>
                    <p className="text-[10px] text-gray-400 pt-1">
                      {new Date(notification.created_at).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  {!notification.read_at && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
