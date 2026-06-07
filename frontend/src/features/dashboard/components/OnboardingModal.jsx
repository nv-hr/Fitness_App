import ProfileForm from '../../profile/components/ProfileForm.jsx';

export default function OnboardingModal({ onSaveSuccess }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl shadow-2xl p-6 sm:p-10 my-8">
        <div className="mb-8 text-center space-y-3">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-white">
            Welcome! Let's set your goals.
          </h1>
          <p className="text-[#888] text-sm sm:text-base max-w-lg mx-auto">
            Before you can use the dashboard, we need to calculate your TDEE and set your fitness goals. This allows us to provide personalized recommendations.
          </p>
        </div>
        <div className="bg-[#111] p-6 rounded-2xl border border-[#222]">
          <ProfileForm isOverlay={true} onSaveSuccess={onSaveSuccess} />
        </div>
      </div>
    </div>
  );
}
