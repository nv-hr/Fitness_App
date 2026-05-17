export const translations = {
  app: {
    title: 'Kalkulator Kesehatan',
  },
  auth: {
    login: 'Masuk',
    register: 'Daftar',
    logout: 'Keluar',
    email: 'Email',
    password: 'Kata Sandi',
    confirmPassword: 'Konfirmasi Kata Sandi',
    loginTitle: 'Masuk ke Akun Anda',
    registerTitle: 'Buat Akun Baru',
    loginButton: 'Masuk',
    registerButton: 'Daftar',
    loginWithGoogle: 'Masuk dengan Google',
    noAccount: 'Belum punya akun?',
    hasAccount: 'Sudah punya akun?',
    pdpConsent: 'Saya menyetujui pengolahan data pribadi saya sesuai dengan Undang-Undang Perlindungan Data Pribadi',
    pdpConsentRequired: 'Anda harus menyetujui pengolahan data pribadi untuk melanjutkan',
    passwordMinLength: 'Kata sandi minimal 8 karakter',
    passwordMismatch: 'Kata sandi tidak cocok',
    invalidEmail: 'Format email tidak valid',
    loginFailed: 'Email atau kata sandi salah',
    registerFailed: 'Pendaftaran gagal',
    emailExists: 'Email sudah terdaftar',
    welcome: 'Selamat datang',
    loading: 'Memuat...',
  },
  validation: {
    required: 'Wajib diisi',
    invalidEmail: 'Format email tidak valid',
    minLength: 'Minimal {{min}} karakter',
  },
};

export function t(key) {
  const keys = key.split('.');
  let value = translations;
  for (const k of keys) {
    if (value === undefined || value === null) return key;
    value = value[k];
  }
  return value !== undefined ? value : key;
}
