import { createClient } from "@/lib/supabase/client";
import { AuthResponse } from "@supabase/supabase-js";
import { LoginInput, SignUpInput } from "@/components/auth/types/schema";

export const authService = {
  async checkEmailExists(email: string): Promise<void> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('check_email_exists_in_auth', {
      email_to_check: email
    });

    if (error) {
      console.error("Lỗi khi kiểm tra RPC Auth, chuyển sang quét bảng public:", error);
      const { data: publicData } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      
      if (publicData) {
        throw new Error("EMAIL_TAKEN");
      }
      return; 
    }
    
    if (data === true) {
      throw new Error("EMAIL_TAKEN");
    }
  },

  async login(values: LoginInput): Promise<AuthResponse["data"]> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(values: SignUpInput) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: values.email.split('@')[0],
        }
      },
    });
    if (error) throw error;
    return data;
  },

  async resetPassword(email: string) {
    // Link khôi phục quay về /auth/update (đã nằm trong allow-list của Supabase).
    // Trang đó tự đổi `code` lấy session rồi cho đặt mật khẩu mới.
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update`,
    });
    if (error) throw error;
  },

  async signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
  }
};