import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useLandingModals from '@/pages/LandingPage/hooks/useLandingModals';
import testCases from '@/data/testCases.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FlaskConical, Info } from 'lucide-react';

export default function SampleTestCasesContainer() {
  const { setValue, trigger } = useFormContext();
  const { openTestCaseHeading, openTestCase } = useLandingModals();
  const [selectedCase, setSelectedCase] = useState('');

  const handleSelectCase = async (testCaseId) => {
    const testCase = testCases.testCases.find((tc) => tc.id === testCaseId);
    if (!testCase) return;

    setSelectedCase(testCaseId);
    setValue('businessProblem', testCase.problem, { shouldValidate: true });
    setValue('businessSolution', testCase.solution, { shouldValidate: true });
    setValue('parameters', testCase.parameters, { shouldValidate: true });
    await trigger();

    toast.success('Test case loaded!', {
      description: `"${testCase.title}" has been loaded into the form.`,
    });
  };

  const getParameterBadgeVariant = (value) => {
    if (value >= 75) return 'default';
    if (value >= 50) return 'secondary';
    return 'outline';
  };

  return (
    <>
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">Sample Test Cases</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={openTestCaseHeading}>
              <Info className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Load realistic circular economy examples for quick testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedCase} onValueChange={handleSelectCase}>
            <SelectTrigger>
              <SelectValue placeholder="Select a test case to load..." />
            </SelectTrigger>
            <SelectContent>
              {testCases.testCases.map((testCase, index) => (
                <SelectItem key={testCase.id} value={testCase.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{index + 1}</span>
                    <span>{testCase.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCase && (
            <div className="space-y-2">
              <Separator />
              {(() => {
                const testCase = testCases.testCases.find((tc) => tc.id === selectedCase);
                return (
                  testCase && (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Parameters:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(testCase.parameters).map(([key, value]) => (
                            <Badge key={key} variant={getParameterBadgeVariant(value)}>
                              {key.replace(/_/g, ' ')}: {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => openTestCase(testCase)}
                      >
                        <Info className="w-4 h-4" />
                        View Full Details
                      </Button>
                    </>
                  )
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
