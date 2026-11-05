import Image from "next/image";

// Cập nhật UserData để khớp với UserProfile từ Hook
export interface UserData {
  username: string | null; // Chấp nhận null
  email: string | null;    // Chấp nhận null
  avatar_url: string | null;
}

export interface ProfileHeaderProps {
  user: UserData;
  isOtherUser: boolean;
  isFollowing: boolean;
  chatAlreadyOpen: boolean;
  onFollow: () => void;
  onChat: () => void;
}

export function ProfileHeader({
  user,
  isOtherUser,
  isFollowing,
  chatAlreadyOpen,
  onFollow,
  onChat,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative w-20 h-20">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username || "User avatar"}
            fill
            className="rounded-full object-cover border border-gray-200"
            unoptimized
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-between">
        <div>
          {/* Xử lý hiển thị nếu username hoặc email bị null */}
          <h1 className="text-2xl font-bold text-gray-900">
            {user.username || "Người dùng chưa đặt tên"}
          </h1>
          <p className="text-gray-500 text-sm">
            {user.email || "Chưa cập nhật email"}
          </p>
        </div>

        {isOtherUser && (
          <div className="flex gap-2">
            <button
              onClick={onFollow}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition cursor-pointer ${
                isFollowing
                  ? "bg-gray-100 text-gray-700 border-gray-300"
                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              }`}
            >
              {isFollowing ? "Đang theo dõi" : "Theo dõi"}
            </button>
            <button
              onClick={onChat}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition cursor-pointer ${
                chatAlreadyOpen
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              {chatAlreadyOpen ? "Đang mở" : "Nhắn tin"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}