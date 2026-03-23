import Box from '@mui/material/Box';
import { PublicHeader } from '../../components/PublicHeader/PublicHeader';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { LandingFooter } from './components/LandingFooter';

export function LandingPage() {
  return (
    <Box sx={{ scrollBehavior: 'smooth' }}>
      <PublicHeader transparent />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
      </main>
      <LandingFooter />
    </Box>
  );
}
