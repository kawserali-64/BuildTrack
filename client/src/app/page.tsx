import { Footer } from '@/components/common/Footer';
import { CapabilitiesSection } from '@/components/modules/landing/CapabilitiesSection';
import { FeaturesSection } from '@/components/modules/landing/FeaturesSection';
import { HeroSection } from '@/components/modules/landing/HeroSection';
import { RolesSection } from '@/components/modules/landing/RolesSection';

export default function PublicLandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50 font-sans text-slate-900">
      <HeroSection />
      <CapabilitiesSection />
      <FeaturesSection />
      <RolesSection />
      <Footer variant="marketing" />
    </div>
  );
}
