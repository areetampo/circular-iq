import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, BarChart3, Leaf, Compass } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-12">
      <Card className="w-full max-w-2xl border-2 border-emerald-100 bg-gradient-to-br from-white to-emerald-50">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 text-emerald-600">
            <Leaf className="w-8 h-8" />
            <span className="text-sm font-semibold uppercase tracking-[0.35em]">
              Circular Economy
            </span>
          </div>
          <CardTitle className="mt-6 text-5xl font-bold text-slate-900">404</CardTitle>
          <CardDescription className="text-lg">Page Not Found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="max-w-xl mx-auto text-base text-slate-600">
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

          <Separator />

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4 text-white" />
              Return Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/assessments')} className="gap-2">
              <BarChart3 className="w-4 h-4 text-gray-700" />
              My Assessments
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
