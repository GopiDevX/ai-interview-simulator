const { z } = require('zod');

const startInterviewSchema = z.object({
  body: z.object({
    role: z.string().min(2, 'Role is required'),
    company: z.string().min(2, 'Company is required'),
    interviewType: z.enum(['technical', 'behavioral', 'full']).optional(),
    resumeText: z.string().optional(),
  })
});

const sessionIdParam = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  })
});

const sendMessageSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z.object({
    content: z.string().min(1, 'Message content is required'),
    stage: z.string().optional(),
    questionIndex: z.number().int().min(0).optional(),
  })
});

const evaluateAnswerSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
  })
});

const evaluateCodeSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z.object({
    question: z.string().min(1, 'Question is required'),
    code: z.string().min(1, 'Code is required'),
    language: z.string().optional(),
  })
});

const updateStageSchema = z.object({
  params: z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  }),
  body: z.object({
    stage: z.string().min(1, 'Stage is required'),
  })
});

module.exports = {
  startInterviewSchema,
  sessionIdParam,
  sendMessageSchema,
  evaluateAnswerSchema,
  evaluateCodeSchema,
  updateStageSchema
};
