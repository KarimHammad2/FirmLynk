import { LoginForm } from "@/components/auth/login-form";
import { listFirms } from "@/lib/repositories/firms";
import { listUsersByFirm } from "@/lib/repositories/users";

export default function LoginPage() {
  const firms = listFirms().map((firm) => ({
    ...firm,
    users: listUsersByFirm(firm.id),
  }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-lg">
        <LoginForm firms={firms} />
      </div>
    </div>
  );
}

