import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@heroui/react';
import { Button } from '@/components/common';
import { ArrowLeft, BarChart3, Leaf, Compass } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-12">
      <Card className="w-full border-2 border-emerald-100 bg-linear-to-br from-white to-emerald-50">
        <div className="px-6 py-8 border-b text-center">
          <div className="flex items-center justify-center gap-3 text-emerald-600">
            <span className="text-sm font-semibold uppercase tracking-[0.35em]">
              Circular Economy Auditor
            </span>
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="mt-6 text-5xl font-bold text-slate-900">404</h1>
          <p className="text-lg text-gray-600 mt-2">Page Not Found</p>
        </div>
        <div className="px-6 py-8 space-y-6 text-center">
          <p className="mx-auto text-base text-slate-600">
            The page you&apos;re looking for doesn&apos;t exist. It may have been moved, renamed, or
            deleted. Let&apos;s get you back on track.
          </p>

          <div className="grid gap-4 p-4 text-left border rounded-xl bg-white/80 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="p-2 mt-1 rounded-full bg-emerald-100 text-emerald-700">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Need guidance?</p>
                <p className="text-xs text-slate-600">
                  Visit the dashboard to evaluate a new business idea.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 mt-1 text-blue-700 bg-blue-100 rounded-full">
                <BarChart3 className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Review past work</p>
                <p className="text-xs text-slate-600">
                  Jump to your saved assessments and comparisons.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200 my-4" />

          <div className="flex flex-wrap justify-center gap-3">
            <Button onPress={() => navigate('/')} variant="tertiary">
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </Button>
            <Button variant="tertiary" onPress={() => navigate('/assessments')}>
              <BarChart3 className="w-4 h-4" />
              My Assessments
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
