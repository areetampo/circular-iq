import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FlaskConical, Info } from 'lucide-react';

export default function SampleTestCasesContainer() {
  const { setValue, trigger } = useFormContext();
  const [selectedCase, setSelectedCase] = useState('');
  const [previewTestCase, setPreviewTestCase] = useState(null);

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toast.info('Sample Test Cases', {
                  description:
                    'Load pre-configured circular economy examples to quickly test the evaluator with realistic data.',
                })
              }
            >
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
                        onClick={() => setPreviewTestCase(testCase)}
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

      {/* Preview Dialog */}
      <Dialog open={!!previewTestCase} onOpenChange={() => setPreviewTestCase(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTestCase?.title}</DialogTitle>
            <DialogDescription>Sample circular economy test case for evaluation</DialogDescription>
          </DialogHeader>
          {previewTestCase && (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Problem:</h4>
                <p className="text-sm text-muted-foreground">{previewTestCase.problem}</p>
              </div>
              <Separator />
              <div>
                <h4 className="mb-2 font-semibold">Solution:</h4>
                <p className="text-sm text-muted-foreground">{previewTestCase.solution}</p>
              </div>
              <Separator />
              <div>
                <h4 className="mb-2 font-semibold">Parameters:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(previewTestCase.parameters).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted"
                    >
                      <span className="text-sm font-medium">{key.replace(/_/g, ' ')}</span>
                      <Badge variant={getParameterBadgeVariant(value)}>{value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
