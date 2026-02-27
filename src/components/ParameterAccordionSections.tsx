'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PersonStanding, Palette, Camera } from 'lucide-react';
import type { ModelAttributes } from '@/lib/types';
import {
  FASHION_STYLE_OPTIONS, GENDER_OPTIONS, AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS,
  BODY_SHAPE_AND_SIZE_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS,
  POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS, TIME_OF_DAY_OPTIONS, OVERALL_MOOD_OPTIONS, MODEL_ANGLE_OPTIONS,
  LIGHTING_TYPE_OPTIONS, LIGHT_QUALITY_OPTIONS, LENS_EFFECT_OPTIONS,
  DEPTH_OF_FIELD_OPTIONS, type OptionWithPromptSegment,
} from '@/lib/prompt-options';

interface ParameterAccordionSectionsProps {
  imageSettings: ModelAttributes;
  settingsMode: 'basic' | 'advanced';
  isPending: boolean;
  onParamChange: (key: keyof ModelAttributes, value: string) => void;
}

function ParameterSelect({ id, label, value, options, isPending, onParamChange }: {
  id: keyof ModelAttributes;
  label: string;
  value: string;
  options: readonly OptionWithPromptSegment[];
  isPending: boolean;
  onParamChange: (key: keyof ModelAttributes, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">{label}</Label>
      <Select value={value} onValueChange={(v) => onParamChange(id, v)} disabled={isPending}>
        <SelectTrigger id={id} className="w-full h-12 md:h-10 text-sm border-muted/60 focus:border-primary/50 bg-background/50">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {options.map((option: OptionWithPromptSegment) => (
            <SelectItem key={option.value} value={option.value} className="text-sm py-3 md:py-2">
              {option.displayLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ParameterAccordionSections({
  imageSettings,
  settingsMode,
  isPending,
  onParamChange,
}: ParameterAccordionSectionsProps) {
  return (
    <Accordion type="multiple" defaultValue={['model-attributes']} className="w-full">
      <AccordionItem value="model-attributes">
        <AccordionTrigger><div className="flex items-center gap-2"><PersonStanding className="h-5 w-5 text-primary" /> Model Attributes</div></AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <ParameterSelect id="gender" label="Gender" value={imageSettings.gender} options={GENDER_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            <ParameterSelect id="bodyShapeAndSize" label="Body Shape & Size" value={imageSettings.bodyShapeAndSize} options={BODY_SHAPE_AND_SIZE_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            <ParameterSelect id="ageRange" label="Age Range" value={imageSettings.ageRange} options={AGE_RANGE_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            <ParameterSelect id="ethnicity" label="Ethnicity" value={imageSettings.ethnicity} options={ETHNICITY_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="art-direction">
        <AccordionTrigger><div className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Art Direction & Styling</div></AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <ParameterSelect id="fashionStyle" label="Fashion Style" value={imageSettings.fashionStyle} options={FASHION_STYLE_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            <ParameterSelect id="poseStyle" label="Pose Style" value={imageSettings.poseStyle} options={POSE_STYLE_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            <ParameterSelect id="modelExpression" label="Model Expression" value={imageSettings.modelExpression} options={MODEL_EXPRESSION_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            <ParameterSelect id="modelAngle" label="Model Angle" value={imageSettings.modelAngle} options={MODEL_ANGLE_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            <ParameterSelect id="hairStyle" label="Hair Style" value={imageSettings.hairStyle} options={HAIR_STYLE_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            <ParameterSelect id="background" label="Background Setting" value={imageSettings.background} options={BACKGROUND_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            {settingsMode === 'advanced' && <ParameterSelect id="timeOfDay" label="Time of Day" value={imageSettings.timeOfDay} options={TIME_OF_DAY_OPTIONS} isPending={isPending} onParamChange={onParamChange} />}
            {settingsMode === 'advanced' && <ParameterSelect id="overallMood" label="Overall Mood" value={imageSettings.overallMood} options={OVERALL_MOOD_OPTIONS} isPending={isPending} onParamChange={onParamChange} />}
          </div>
        </AccordionContent>
      </AccordionItem>

      {settingsMode === 'advanced' && (
        <AccordionItem value="photography-technical">
          <AccordionTrigger><div className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Photography & Technical</div></AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <ParameterSelect id="lightingType" label="Lighting Type" value={imageSettings.lightingType} options={LIGHTING_TYPE_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
              <ParameterSelect id="lightQuality" label="Light Quality" value={imageSettings.lightQuality} options={LIGHT_QUALITY_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
              <ParameterSelect id="lensEffect" label="Lens Effect" value={imageSettings.lensEffect} options={LENS_EFFECT_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
              <ParameterSelect id="depthOfField" label="Depth of Field" value={imageSettings.depthOfField} options={DEPTH_OF_FIELD_OPTIONS} isPending={isPending} onParamChange={onParamChange} />
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
