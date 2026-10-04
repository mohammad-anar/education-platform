export type IRegisterUser = {
  firstName: string;
  middleName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
  roleCode?: string;
  instituteId?: string;
};

export type ILoginUser = {
  email: string;
  password: string;
};

export type IChangePassword = {
  oldPassword: string;
  newPassword: string;
};

export type IForgotPassword = {
  email: string;
};

export type IResetPassword = {
  token: string;
  newPassword: string;
};

export type IRefreshToken = {
  refreshToken: string;
};

export type ISendOtp = {
  email: string;
};

export type IVerifyOtp = {
  email: string;
  otp: string;
};
