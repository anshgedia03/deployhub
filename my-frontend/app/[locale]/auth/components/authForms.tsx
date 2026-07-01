"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useRouter } from "@/i18n/routing";
import { AuthContainer } from "@/app/[locale]/auth/components/authContainer";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/useAuthStore";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

const signupSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .regex(/^[a-zA-Z\s]*$/, "Name must contain only letters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    ),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function LoginForm() {
  const { signIn, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth");
  const rawReturnUrl = searchParams.get("returnUrl") || "/home";
  // Clean returnUrl if it already contains a locale prefix to avoid doubling it up (e.g. /de/de/home)
  const returnUrl =
    rawReturnUrl.startsWith("/") &&
    (rawReturnUrl.startsWith("/de") || rawReturnUrl.startsWith("/en"))
      ? rawReturnUrl.replace(/^\/(de|en)(\/|$)/, "/")
      : rawReturnUrl;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await signIn(data);
      router.push(returnUrl);
    } catch (error: any) {
      console.error("Login failed", error);
      const responseData = error.response?.data;
      const message = responseData?.message;

      // Redirect to verification only if the account is unverified
      if (message === "Please verify email") {
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(data.email)}` as any,
        );
      }
    }
  };

  return (
    <AuthContainer title={t("loginTitle")} description={t("loginDescription")}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col items-center"
      >
        <FloatingInput
          id="email"
          label={t("emailLabel")}
          labelBg="#EDEDED"
          type="email"
          containerClassName="mb-[20px]"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="w-full">
          <FloatingInput
            id="password"
            label={t("passwordLabel")}
            labelBg="#EDEDED"
            type="password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex items-center w-full flex-col sm:flex-row gap-2 sm:gap-0 justify-between mt-[32px]">
            <label className="flex items-center group -ml-[11px] cursor-pointer">
              <div className="p-[9px] rounded-full hover:bg-[rgba(0,0,0,0.04)] transition-colors">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setValue("rememberMe", checked as boolean)
                  }
                  className="w-[18px] h-[18px] rounded-[2px] border-[2px] border-[#D1D5DB] data-[state=checked]:bg-[#773CDD] data-[state=checked]:border-[#773CDD] transition-all"
                />
              </div>
              <span className="text-[14px] leading-[21px] font-normal text-[rgb(15,23,41)]">
                {t("rememberMe")}{" "}
                <span className="font-medium">{t("days")}</span>
              </span>
            </label>
            <Link
              href="/auth/forgot-password"
              title="Forgot Password"
              className="text-[14px] leading-[20px] font-normal text-[rgb(124,59,237)] hover:underline transition-colors mr-1"
            >
              {t("forgotPassword")}
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-auto min-h-[42px] bg-[#773CDD] hover:bg-[#602eb8] text-white text-[14px] leading-[1.75] font-medium rounded-lg mt-[36px] px-4 py-1.5 transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-70 shadow-none border-0"
        >
          {isLoading ? t("signingIn") : t("signIn")}
        </Button>
      </form>
    </AuthContainer>
  );
}

export function SignupForm() {
  const { signUp, isLoading } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("Auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signUp(data);
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(data.email)}` as any,
      );
    } catch (error) {
      console.error("Signup failed", error);
    }
  };

  return (
    <AuthContainer
      title={t("signupTitle")}
      description={t("signupDescription")}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col items-center"
      >
        <FloatingInput
          id="name"
          labelBg="#EDEDED"
          label={t("fullNameLabel")}
          type="text"
          containerClassName="mb-[20px]"
          error={errors.name?.message}
          {...register("name")}
        />
        <FloatingInput
          id="email"
          labelBg="#EDEDED"
          label={t("emailLabel")}
          type="email"
          containerClassName="mb-[20px]"
          error={errors.email?.message}
          {...register("email")}
        />
        <FloatingInput
          id="password"
          labelBg="#EDEDED"
          label={t("passwordLabel")}
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-auto min-h-[42px] bg-[#773CDD] hover:bg-[#602eb8] text-white text-[14px] leading-[1.75] font-medium rounded-lg mt-[36px] px-4 py-1.5 transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-70 shadow-none border-0"
        >
          {isLoading ? t("creatingAccount") : t("getStarted")}
        </Button>
      </form>
    </AuthContainer>
  );
}
