import React, { useState } from "react";
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
  "assignments": [],
  "documents": [],
  "documentTypes": [
    {
      "id": "DT-001",
      "name": "Resume/CV",
      "required": true
    },
    {
      "id": "DT-002",
      "name": "Acceptance Letter",
      "required": true
    },
    {
      "id": "DT-003",
      "name": "Internship Agreement",
      "required": true
    },
    {
      "id": "DT-004",
      "name": "Medical Certificate",
      "required": true
    },
    {
      "id": "DT-005",
      "name": "Parent Consent",
      "required": true
    },
    {
      "id": "DT-006",
      "name": "Insurance Form",
      "required": false
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

export default function Documents() {
  const { darkMode } = useOutletContext();
  const state = localState;
  const submitDocument = (...args) => { void args; };
  const studentId = state.currentUser?.profileId;
  const assignment = state.assignments.find(
    (item) => item.studentId === studentId
  );
  const documents = state.documents.filter(
    (item) => item.studentId === studentId
  );
  const [selectedFiles, setSelectedFiles] = useState({});
  const card = darkMode
    ? "bg-slate-900 border-slate-700"
    : "bg-white border-slate-200";
  const submit = (typeId) => {
    if (!assignment)
      return alert(
        "Documents become available after an application is approved and an assignment is created."
      );
    const fileName = selectedFiles[typeId];
    if (!fileName) return alert("Choose a mock file first.");
    submitDocument({
      studentId,
      assignmentId: assignment.id,
      documentTypeId: typeId,
      fileName,
    });
  };
  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1200px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Student Portal
        </p>
        <h1 className="text-2xl font-black">Document Submission</h1>
        <p className="text-sm mt-1 text-slate-500">
          Submit documents against the shared internship assignment.
        </p>
      </div>
      {assignment ? (
        <p className="mb-4 text-xs text-emerald-600 font-semibold">
          Assignment {assignment.id} · {assignment.status}
        </p>
      ) : (
        <p className="mb-4 text-xs text-amber-600">
          No assignment yet. Ask a registrar to review your application.
        </p>
      )}
      <section className={`border rounded-2xl overflow-hidden ${card}`}>
        <div className="divide-y divide-slate-200">
          {state.documentTypes.map((type) => {
            const record = documents.find(
              (item) => item.documentTypeId === type.id
            );
            return (
              <div
                key={type.id}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="font-semibold">
                    {type.name}
                    {type.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {record
                      ? `${record.fileName} · version ${record.version}`
                      : "Not submitted"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold ${
                      record?.status === STATUS.document.APPROVED
                        ? "text-emerald-600"
                        : record?.status === STATUS.document.NEEDS_REVISION
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    {record?.status || STATUS.document.NOT_SUBMITTED}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label
                      htmlFor={`file-${type.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer transition"
                    >
                      Choose File
                    </label>

                    <input
                      id={`file-${type.id}`}
                      type="file"
                      className="hidden"
                      onChange={(event) =>
                        setSelectedFiles((previous) => ({
                          ...previous,
                          [type.id]: event.target.files?.[0]?.name,
                        }))
                      }
                    />

                    <span className="text-xs text-slate-500 truncate max-w-[180px]">
                      {selectedFiles[type.id] || "No file chosen"}
                    </span>
                  </div>
                  <button
                    className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                    onClick={() => submit(type.id)}
                  >
                    Submit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
