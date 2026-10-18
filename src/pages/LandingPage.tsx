import React from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { HeroCLogo } from '@/components/3d/HeroCLogo';
import { CameraRig } from '@/components/3d/CameraRig';
import { MedicalObjects } from '@/components/3d/MedicalObjects';
import { Stethoscope, ArrowRight, ShieldCheck } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <CameraRig intensity={0.3} fixedZ={6} />
          <HeroCLogo scale={1.4} />
          <MedicalObjects />
        </Canvas>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="flex items-center gap-2 mb-6">
          <Stethoscope className="w-8 h-8 text-sky-400" />
          <span className="text-2xl font-bold">CareBridge AI</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 max-w-3xl">
          From Hospital Discharge to <span className="text-sky-400">Patient Understanding</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mb-8">
          Zero-hallucination care plans. Every instruction traced back to the original clinical source.
        </p>
        <div className="flex gap-4">
          <Link to="/signup" className="px-6 py-3 bg-sky-500 hover:bg-sky-400 rounded-xl font-semibold flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="px-6 py-3 border border-slate-600 hover:border-slate-400 rounded-xl font-semibold">
            Sign In
          </Link>
        </div>
        <div className="mt-12 flex items-center gap-2 text-sm text-emerald-400">
          <ShieldCheck className="w-4 h-4" /> Source Fidelity Guaranteed
        </div>
      </div>
    </div>
  );
};
