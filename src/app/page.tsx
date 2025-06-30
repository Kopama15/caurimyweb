import AuthEmail from "./components/AuthEmail";
import AuthOTP from "./components/AuthOTP";

export default function Home() {
  return (
    <main className="p-4 space-y-10 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Email Auth</h1>
      <AuthEmail />

      <h1 className="text-xl font-bold">Phone Auth (OTP)</h1>
      <AuthOTP />
    </main>
  );
}
