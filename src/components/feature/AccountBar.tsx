import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function AccountBar() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => navigate("/inquiry")}
        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-background-300 bg-background-50 px-3 py-1.5 text-xs font-semibold text-foreground-700 transition-colors hover:bg-background-100"
      >
        <i className="ri-question-answer-line" aria-hidden="true"></i>
        문의하기
      </button>
      {isAdmin && (
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800 transition-colors hover:bg-primary-100"
        >
          <i className="ri-shield-user-line" aria-hidden="true"></i>
          회원관리
        </button>
      )}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-background-100 px-3 py-1.5 text-xs font-medium text-foreground-700">
        <i className="ri-user-line text-foreground-500" aria-hidden="true"></i>
        {profile.name || profile.email}
        {isAdmin ? " · 운영자" : " 님"}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-background-300 px-3 py-1.5 text-xs font-medium text-foreground-700 transition-colors hover:bg-background-100"
      >
        <i className="ri-logout-box-r-line" aria-hidden="true"></i>
        로그아웃
      </button>
    </div>
  );
}