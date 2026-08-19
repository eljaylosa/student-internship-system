import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

// Temporary page-local demo data. This page intentionally has no mockStore dependency.
const localState = {
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
  "currentUser": {
    "id": "USR-002",
    "role": "registrar",
    "email": "registrar@gmail.com",
    "password": "password",
    "status": "Active",
    "profileId": "FAC-001"
  },
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
  "assignments": [],
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

export default function Application() {
  const { darkMode } = useOutletContext();
  const state = localState;
  const submitApplication = (...args) => { void args; };
  const saveApplicationDraft = (...args) => { void args; };
  const student = state.students.find(
    (item) => item.id === state.currentUser?.profileId
  );
  const [activeTab, setActiveTab] = useState("apply");
  const [opportunityId, setOpportunityId] = useState(
    state.opportunities.find(
      (item) => item.status === STATUS.opportunity.ACTIVE
    )?.id || ""
  );
  const [coverLetter, setCoverLetter] = useState("");
  const opportunities = state.opportunities.filter(
    (item) => item.status === STATUS.opportunity.ACTIVE
  );
  const applications = state.applications.filter(
    (item) => item.studentId === student?.id
  );
  const assignment = state.assignments.find(
    (item) => item.studentId === student?.id
  );
  const selectedOpportunity = opportunities.find(
    (item) => item.id === opportunityId
  );
  const input = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-100"
    : "bg-slate-50 border-slate-200 text-slate-700";
  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";
  const apply = (draft = false) => {
    if (!opportunityId)
      return alert("Please select an internship opportunity.");
    if (draft)
      saveApplicationDraft({
        studentId: student.id,
        opportunityId,
        coverLetter,
      });
    else
      submitApplication({ studentId: student.id, opportunityId, coverLetter });
    setActiveTab("status");
  };
  const statusTone = (status) =>
    status === STATUS.application.APPROVED
      ? "text-emerald-600"
      : status === STATUS.application.REJECTED
      ? "text-red-600"
      : "text-amber-600";
  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Student Portal
        </p>
        <h1 className="text-2xl font-black">Internship Application</h1>
        <p className="text-sm mt-1 text-slate-500">
          Apply to a shared company opportunity and track the same application
          registrar reviews.
        </p>
      </div>
      <div
        className={`inline-flex p-1 border rounded-xl mb-5 ${
          darkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-slate-100 border-slate-200"
        }`}
      >
        {["apply", "status"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg text-xs font-semibold ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            {tab === "apply" ? "Apply" : "View Status"}
          </button>
        ))}
      </div>
      {activeTab === "apply" ? (
        <section className={`border rounded-2xl p-5 md:p-6 ${card}`}>
          <h2 className="font-bold text-lg mb-4">Available opportunities</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {opportunities.map((opportunity) => (
              <button
                key={opportunity.id}
                type="button"
                onClick={() => setOpportunityId(opportunity.id)}
                className={`text-left border rounded-xl p-4 ${
                  opportunityId === opportunity.id
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex justify-between gap-2">
                  <strong>{opportunity.title}</strong>
                  <span className="text-[10px] text-emerald-600">
                    {opportunity.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {
                    state.companies.find(
                      (company) => company.id === opportunity.companyId
                    )?.name
                  }{" "}
                  · {opportunity.location}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {opportunity.description}
                </p>
                <p className="text-[10px] text-slate-400 mt-3">
                  {opportunity.id} · {opportunity.availability}
                </p>
              </button>
            ))}
          </div>
          {selectedOpportunity && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Selected opportunity
                </label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${input}`}
                  value={`${selectedOpportunity.id} — ${selectedOpportunity.title}`}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Cover letter
                </label>
                <textarea
                  rows="5"
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${input}`}
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  placeholder="Explain your interest in this opportunity."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border text-xs font-semibold"
                  onClick={() => apply(true)}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                  onClick={() => apply(false)}
                >
                  Submit Application
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className={`border rounded-2xl p-5 md:p-6 ${card}`}>
          <h2 className="font-bold text-lg mb-4">
            Application and assignment status
          </h2>
          {applications.length === 0 ? (
            <p className="text-sm text-slate-500">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => {
                const opportunity = state.opportunities.find(
                  (item) => item.id === application.opportunityId
                );
                return (
                  <div key={application.id} className="border rounded-xl p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {opportunity?.title || application.opportunityId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {application.id} · submitted{" "}
                          {application.submittedAt
                            ? new Date(
                                application.submittedAt
                              ).toLocaleDateString()
                            : "not submitted"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold ${statusTone(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {application.notes}
                    </p>
                    {application.assignmentId && (
                      <p className="text-xs text-emerald-600 font-semibold mt-2">
                        Assignment created: {application.assignmentId}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {assignment && (
            <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
              <strong>Internship Assignment {assignment.id}</strong>
              <p className="mt-1">
                {assignment.startDate} to {assignment.endDate} ·{" "}
                {assignment.status}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
