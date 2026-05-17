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
  profile: {
    title: 'Profil & Kalkulator BMI',
    weight: 'Berat Badan (kg)',
    height: 'Tinggi Badan (cm)',
    age: 'Usia',
    gender: 'Jenis Kelamin',
    male: 'Laki-laki',
    female: 'Perempuan',
    other: 'Lainnya',
    fitnessGoal: 'Tujuan Kebugaran',
    loseWeight: 'Menurunkan Berat Badan',
    maintain: 'Menjaga Berat Badan',
    gainWeight: 'Menambah Berat Badan',
    saveProfile: 'Simpan Profil',
    updateProfile: 'Perbarui Profil',
    profileSaved: 'Profil berhasil disimpan',
    profileUpdated: 'Profil berhasil diperbarui',
    profileError: 'Gagal menyimpan profil',
    weightRequired: 'Berat badan wajib diisi',
    heightRequired: 'Tinggi badan wajib diisi',
    ageRequired: 'Usia wajib diisi',
    genderRequired: 'Jenis kelamin wajib diisi',
    fitnessGoalRequired: 'Tujuan kebugaran wajib diisi',
    weightMin: 'Berat badan minimal 2 kg',
    weightMax: 'Berat badan maksimal 300 kg',
    heightMin: 'Tinggi badan minimal 50 cm',
    heightMax: 'Tinggi badan maksimal 250 cm',
    ageMin: 'Usia minimal 5 tahun',
    ageMax: 'Usia maksimal 120 tahun',
  },
  bmi: {
    yourBmi: 'BMI Anda',
    underweight: 'Berat Badan Kurang',
    normal: 'Normal',
    overweight: 'Berat Badan Lebih',
    obese: 'Obesitas',
    disclaimer: 'Hasil ini adalah estimasi dan bukan diagnosis medis.',
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
