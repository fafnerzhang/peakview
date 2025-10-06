import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Play } from 'lucide-react';

interface WorkflowResumePanelProps {
  workflowId: string;
  runId: string;
  suspendedSteps: string | string[];
  onResume?: (resumeData: Record<string, unknown>) => Promise<void>;
}

export function WorkflowResumePanel({
  workflowId,
  runId,
  suspendedSteps,
  onResume,
}: WorkflowResumePanelProps) {
  const [resumeData, setResumeData] = useState<string>('{}');
  const [isResuming, setIsResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResume = async () => {
    try {
      setIsResuming(true);
      setError(null);

      let parsedData: Record<string, unknown>;
      try {
        parsedData = JSON.parse(resumeData);
      } catch (e) {
        throw new Error('Invalid JSON format');
      }

      await onResume?.(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume workflow');
    } finally {
      setIsResuming(false);
    }
  };

  const steps = Array.isArray(suspendedSteps) ? suspendedSteps : [suspendedSteps];

  return (
    <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-orange-900 mb-1">
            ⏸️ Workflow Suspended
          </div>
          <div className="text-xs text-orange-700">
            Workflow: <code className="bg-orange-100 px-1 py-0.5 rounded">{workflowId}</code>
          </div>
          <div className="text-xs text-orange-700 mt-1">
            Run ID: <code className="bg-orange-100 px-1 py-0.5 rounded">{runId}</code>
          </div>
          <div className="text-xs text-orange-700 mt-1">
            Suspended steps: {steps.map((step, idx) => (
              <code key={idx} className="bg-orange-100 px-1 py-0.5 rounded mr-1">
                {step}
              </code>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-orange-900 block">
          Resume Data (JSON):
        </label>
        <textarea
          value={resumeData}
          onChange={(e) => setResumeData(e.target.value)}
          placeholder='{"key": "value"}'
          className="w-full px-3 py-2 text-sm font-mono border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          rows={4}
        />
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </div>
      )}

      <Button
        onClick={handleResume}
        disabled={isResuming || !onResume}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        size="sm"
      >
        <Play className="w-4 h-4 mr-2" />
        {isResuming ? 'Resuming...' : 'Resume Workflow'}
      </Button>
    </div>
  );
}
