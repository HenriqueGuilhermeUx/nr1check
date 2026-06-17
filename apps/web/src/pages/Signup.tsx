import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Signup() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">NR1Check</span>
      </Link>
      <SignUp routing="path" path="/cadastro" signInUrl="/login" />
    </div>
  );
}
