import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { parameterLabels, parameterGroups, parameterGuidance } from '@/constants/evaluationData';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export default function ParameterInputContainer({ loading }) {
  const { control } = useFormContext();

  const getScaleMarkers = (key) => {
    const guidance = parameterGuidance[key];
    if (!guidance || !guidance.scale) return null;
    // Return simplified scale with 3 key points
    return guidance.scale.filter((_, i) => i % 2 === 0).slice(0, 3);
  };

  const getScaleBadgeVariant = (idx) => {
    if (idx === 0) return 'destructive';
    if (idx === 1) return 'secondary';
    return 'default';
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 space-y-6">
          {Object.entries(parameterGroups).map(([groupName, keys], groupIdx) => (
            <div key={groupName} className="space-y-4">
              {groupIdx > 0 && <Separator />}
              <h3 className="text-lg font-semibold text-foreground">{groupName}</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {keys.map((key) => {
                  const scaleMarkers = getScaleMarkers(key);
                  const guidance = parameterGuidance[key];

                  return (
                    <div key={key} className="p-4 space-y-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={key} className="text-sm font-medium">
                          {parameterLabels[key].label}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="p-1 rounded-full hover:bg-muted"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Info className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold">{parameterLabels[key].label}</p>
                            {guidance && guidance.description && (
                              <p className="mt-1 text-sm">{guidance.description}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <Controller
                        name={`parameters.${key}`}
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Slider
                                value={[field.value ?? 0]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                                max={100}
                                step={1}
                                className="flex-1"
                                disabled={loading}
                              />
                              <Input
                                type="number"
                                id={key}
                                min={0}
                                max={100}
                                step={1}
                                value={field.value ?? 0}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (val === '') {
                                    field.onChange(0);
                                    return;
                                  }
                                  const numVal = Math.min(100, Math.max(0, Number(val)));
                                  field.onChange(numVal);
                                }}
                                className="w-20 font-semibold text-center"
                                disabled={loading}
                              />
                            </div>

                            {/* Scale Guide */}
                            {scaleMarkers && (
                              <div className="flex flex-col gap-1">
                                {scaleMarkers.map((marker, idx) => {
                                  const endScore = Math.min(marker.score + 10, 100);
                                  return (
                                    <Badge
                                      key={idx}
                                      variant={getScaleBadgeVariant(idx)}
                                      className="justify-start text-xs"
                                    >
                                      {marker.score}-{endScore}: {marker.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}

                            {/* Example Calibration */}
                            {guidance && guidance.examples && guidance.examples[0] && (
                              <p className="text-xs italic text-muted-foreground">
                                Example: {guidance.examples[0].case} = {guidance.examples[0].score}
                                {guidance.examples[0].reason && ` (${guidance.examples[0].reason})`}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

ParameterInputContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
};
