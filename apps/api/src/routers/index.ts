import { router } from "../trpc";
import { authRouter } from "./auth";
import { companyRouter } from "./company";
import { employeeRouter } from "./employee";
import { assessmentRouter } from "./assessment";
import { psychosocialRouter } from "./psychosocial";
import { courseRouter } from "./course";
import { complaintRouter } from "./complaint";
import { pgrRouter } from "./pgr";
import { complianceRouter } from "./compliance";
import { stripeRouter } from "./stripe";
import { wooviRouter } from "./woovi";
import { notificationRouter } from "./notification";

export const appRouter = router({
  auth: authRouter,
  company: companyRouter,
  employee: employeeRouter,
  assessment: assessmentRouter,
  psychosocial: psychosocialRouter,
  course: courseRouter,
  complaint: complaintRouter,
  pgr: pgrRouter,
  compliance: complianceRouter,
  stripe: stripeRouter,
  woovi: wooviRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
