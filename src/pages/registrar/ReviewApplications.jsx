import React from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
  "currentUser": {
    "id": "USR-002",
    "role": "registrar",
    "email": "registrar@gmail.com",
    "password": "password",
    "status": "Active",
    "profileId": "FAC-001"
  },
  "applications": [
    {
      "id": "APP-001",
      "studentId": "STU-001",
      "opportunityId": "OPP-001",
      "submittedAt": "2026-05-01T09:00:00.000Z",
      "status": "Submitted",
      "coverLetter": "I am excited to contribute to the team and learn through this placement.",
      "reviewerId": "FAC-001",
      "notes": "Awaiting registrar review."
    }
  ],
  "students": [
    {
      "id": "STU-001",
      "userId": "USR-001",
      "fullName": "John Doe",
      "email": "student@gmail.com",
      "studentId": "STU-001",
      "program": "BS Information Technology",
      "yearLevel": "2nd Year",
      "department": "College of Information and Communications Technology",
      "facultyId": "FAC-001",
      "phone": "+63 912 345 6789",
      "address": "Limay, Bataan",
      "gwa": "1.75"
    }
  ],
  "opportunities": [
    {
      "id": "OPP-001",
      "companyId": "COM-001",
      "supervisorId": "SUP-001",
      "title": "Web Developer Intern",
      "description": "Build and improve internal web experiences with the engineering team.",
      "location": "Balanga, Bataan",
      "positionType": "On-site",
      "availability": "June - August 2026",
      "requirements": [
        "HTML/CSS",
        "JavaScript",
        "Git"
      ],
      "status": "Active",
      "openings": 3
    }
  ],
  "companies": [
    {
      "id": "COM-001",
      "name": "ABC Technologies",
      "industry": "Information Technology",
      "status": "Verified",
      "address": "Balanga, Bataan",
      "email": "hr@abctech.com",
      "supervisorIds": [
        "SUP-001"
      ]
    }
  ]
};
const STATUS = {
  "user": {
    "ACTIVE": "Active",
    "INACTIVE": "Inactive",
    "PENDING": "Pending"
  },
  "company": {
    "PENDING": "Pending",
    "VERIFIED": "Verified",
    "ACTIVE": "Active",
    "INACTIVE": "Inactive"
  },
  "opportunity": {
    "DRAFT": "Draft",
    "ACTIVE": "Active",
    "CLOSED": "Closed"
  },
  "application": {
    "DRAFT": "Draft",
    "SUBMITTED": "Submitted",
    "UNDER_REVIEW": "Under Review",
    "INFO_REQUESTED": "Information Requested",
    "APPROVED": "Approved",
    "REJECTED": "Rejected",
    "WITHDRAWN": "Withdrawn"
  },
  "assignment": {
    "PENDING": "Pending",
    "ACTIVE": "Active",
    "COMPLETED": "Completed",
    "SUSPENDED": "Suspended",
    "TERMINATED": "Terminated"
  },
  "document": {
    "NOT_SUBMITTED": "Not Submitted",
    "SUBMITTED": "Submitted",
    "PENDING_REVIEW": "Pending Review",
    "APPROVED": "Approved",
    "NEEDS_REVISION": "Needs Revision"
  },
  "evaluation": {
    "DRAFT": "Draft",
    "SUBMITTED": "Submitted",
    "RETURNED": "Returned",
    "FINALIZED": "Finalized"
  }
};

export default function ReviewApplications() {
  const { darkMode } = useOutletContext();
  const state = localState;
  const updateApplicationStatus = (...args) => { void args; };
  const facultyId = state.currentUser?.profileId;
  const applications = state.applications.filter(
    (item) => item.reviewerId === facultyId
  );
  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";
  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Registrar Adviser Portal
        </p>
        <h1 className="text-2xl font-black">Internship Applications</h1>
        <p className="text-sm mt-1 text-slate-500">
          Review the same applications submitted by students.
        </p>
      </div>
      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        <div className="p-5 border-b border-slate-200">
          <strong>
            {applications.length} assigned application
            {applications.length === 1 ? "" : "s"}
          </strong>
        </div>
        <div className="divide-y divide-slate-200">
          {applications.map((application) => {
            const student = state.students.find(
              (item) => item.id === application.studentId
            );
            const opportunity = state.opportunities.find(
              (item) => item.id === application.opportunityId
            );
            const company = state.companies.find(
              (item) => item.id === opportunity?.companyId
            );
            return (
              <div key={application.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="font-bold">
                      {student?.fullName} · {opportunity?.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {application.id} · {student?.id} · {company?.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-3">
                      {application.coverLetter || "No cover letter provided."}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {application.notes}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-600">
                    {application.status}
                  </span>
                </div>
                {![
                  STATUS.application.APPROVED,
                  STATUS.application.REJECTED,
                ].includes(application.status) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                      onClick={() =>
                        updateApplicationStatus(
                          application.id,
                          STATUS.application.APPROVED,
                          "Approved by registrar."
                        )
                      }
                    >
                      Approve & Create Assignment
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg border text-xs font-semibold"
                      onClick={() =>
                        updateApplicationStatus(
                          application.id,
                          STATUS.application.INFO_REQUESTED,
                          "Please provide additional application information."
                        )
                      }
                    >
                      Request Information
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold"
                      onClick={() =>
                        updateApplicationStatus(
                          application.id,
                          STATUS.application.REJECTED,
                          "Application rejected by registrar."
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
                {application.assignmentId && (
                  <p className="mt-4 text-xs font-semibold text-emerald-600">
                    Shared assignment created: {application.assignmentId}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
