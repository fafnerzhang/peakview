/**
 * TypeScript definitions matching the WorkoutPlan schema from peakflow analytics
 * 
 * This file provides type-safe interfaces that correspond to the Python Pydantic models
 * used in the peakflow TSS calculation system.
 */

export type IntensityMetric = 'power' | 'heart_rate' | 'pace';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

/**
 * Represents a segment of a workout plan with specific intensity and duration.
 * 
 * This matches the WorkoutPlanSegment Pydantic model from peakflow.analytics.tss
 */
export interface WorkoutPlanSegment {
  /** Duration in minutes (must be positive) */
  duration_minutes: number;
  
  /** Type of intensity metric */
  intensity_metric: IntensityMetric;
  
  /** Target intensity value (watts, bpm, or min/km) */
  target_value: number;
}

/**
 * Represents a complete workout plan as a collection of segments.
 * 
 * This matches the WorkoutPlan Pydantic model from peakflow.analytics.tss
 */
export interface WorkoutPlan {
  /** Workout segments - at least one required */
  segments: WorkoutPlanSegment[];
  
  /** Optional workout name */
  name?: string;
  
  /** Optional workout description */
  description?: string;
}

/**
 * Extended workout plan with additional metadata for LLM context and UI display
 */
export interface WorkoutPlanWithMetadata {
  /** Core workout plan matching the peakflow schema */
  workoutPlan: WorkoutPlan;
  
  /** Additional metadata for context and planning */
  metadata: {
    /** Total workout duration calculated from all segments */
    total_duration_minutes: number;
    
    /** Main training focus (e.g., 'endurance', 'intervals', 'recovery') */
    primary_focus: string;
    
    /** Distribution of workout intensity across different zones */
    intensity_distribution: {
      /** Percentage of time in easy/recovery zones */
      easy_percentage: number;
      
      /** Percentage of time in moderate zones */
      moderate_percentage: number;
      
      /** Percentage of time in hard/anaerobic zones */
      hard_percentage: number;
    };
    
    /** Estimated Training Stress Score if calculable */
    estimated_tss?: number;
    
    /** Recommended fitness level */
    difficulty_level: DifficultyLevel;
    
    /** Required equipment (e.g., 'power meter', 'heart rate monitor') */
    equipment_needed: string[];
  };
}

/**
 * Utility functions for working with workout plans
 */
export class WorkoutPlanUtils {
  /**
   * Calculate total duration of a workout plan
   */
  static getTotalDuration(plan: WorkoutPlan): number {
    return plan.segments.reduce((total, segment) => total + segment.duration_minutes, 0);
  }
  
  /**
   * Convert duration to hours for TSS calculations
   */
  static getTotalDurationHours(plan: WorkoutPlan): number {
    return this.getTotalDuration(plan) / 60.0;
  }
  
  /**
   * Validate that target values are reasonable for the intensity metric
   */
  static validateSegment(segment: WorkoutPlanSegment): boolean {
    const { intensity_metric, target_value } = segment;
    
    switch (intensity_metric) {
      case 'power':
        return target_value > 0 && target_value <= 2000; // Watts
      case 'heart_rate':
        return target_value >= 30 && target_value <= 250; // BPM
      case 'pace':
        return target_value >= 1.0 && target_value <= 20.0; // min/km
      default:
        return false;
    }
  }
  
  /**
   * Format target value with appropriate units
   */
  static formatTargetValue(metric: IntensityMetric, value: number): string {
    switch (metric) {
      case 'power':
        return `${Math.round(value)}W`;
      case 'heart_rate':
        return `${Math.round(value)} bpm`;
      case 'pace':
        const minutes = Math.floor(value);
        const seconds = Math.round((value - minutes) * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
      default:
        return value.toString();
    }
  }
}

/**
 * Type guard to check if an object is a valid WorkoutPlan
 */
export function isWorkoutPlan(obj: any): obj is WorkoutPlan {
  return obj && 
         Array.isArray(obj.segments) && 
         obj.segments.length > 0 &&
         obj.segments.every((segment: any) => 
           typeof segment.duration_minutes === 'number' &&
           segment.duration_minutes > 0 &&
           ['power', 'heart_rate', 'pace'].includes(segment.intensity_metric) &&
           typeof segment.target_value === 'number' &&
           segment.target_value > 0
         );
}

/**
 * Type guard to check if an object is a valid WorkoutPlanWithMetadata
 */
export function isWorkoutPlanWithMetadata(obj: any): obj is WorkoutPlanWithMetadata {
  return obj && 
         isWorkoutPlan(obj.workoutPlan) &&
         obj.metadata &&
         typeof obj.metadata.total_duration_minutes === 'number' &&
         typeof obj.metadata.primary_focus === 'string' &&
         obj.metadata.intensity_distribution &&
         typeof obj.metadata.difficulty_level === 'string' &&
         Array.isArray(obj.metadata.equipment_needed);
}