import { Routes, Route, Navigate } from "react-router-dom";
import { EmployeeLayout } from "../components/EmployeeLayout";
import { EmployeeHome } from "./employee/EmployeeHome";
import { EmployeeAssessment } from "./employee/EmployeeAssessment";
import { EmployeeCourses } from "./employee/EmployeeCourses";
import { EmployeeCoursePlayer } from "./employee/EmployeeCoursePlayer";
import { EmployeeComplaint } from "./employee/EmployeeComplaint";
import { EmployeeDocuments } from "./employee/EmployeeDocuments";

export default function EmployeePortal() {
  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route index element={<EmployeeHome />} />
        <Route path="avaliacao" element={<EmployeeAssessment />} />
        <Route path="cursos" element={<EmployeeCourses />} />
        <Route path="cursos/:id" element={<EmployeeCoursePlayer />} />
        <Route path="denuncia" element={<EmployeeComplaint />} />
        <Route path="documentos" element={<EmployeeDocuments />} />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Route>
    </Routes>
  );
}
