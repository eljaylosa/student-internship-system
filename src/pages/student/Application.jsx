import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabaseStudent } from "../../supabaseClient";

// =========================================================
// STATUS
// =========================================================

const STATUS = {
  opportunity: {
    ACTIVE: "active",
    CLOSED: "closed",
  },

  application: {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    UNDER_REVIEW: "under_review",
    INFO_REQUESTED: "info_requested",
    APPROVED: "approved",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    WITHDRAWN: "withdrawn",
  },

  assignment: {
    PENDING: "pending",
    ACTIVE: "active",
    COMPLETED: "completed",
    SUSPENDED: "suspended",
    TERMINATED: "terminated",
  },
};

// =========================================================
// APPLICATION
// =========================================================

export default function Application() {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [student, setStudent] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // ---------------------------------------------------------
  // OPPORTUNITY CAPACITY
  //
  // {
  //   [opportunityId]: {
  //     total_openings,
  //     occupied_slots,
  //     available_slots
  //   }
  // }
  // ---------------------------------------------------------

  const [capacityByOpportunityId, setCapacityByOpportunityId] = useState({});

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingPlacement, setIsConfirmingPlacement] = useState(false);

  const [activeTab, setActiveTab] = useState("apply");

  const [opportunityId, setOpportunityId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  const [isReapplying, setIsReapplying] = useState(false);

  // =========================================================
  // LOAD OPPORTUNITY CAPACITIES
  // =========================================================

  const loadOpportunityCapacities = async (opportunityList) => {
    const activeOpportunities = (opportunityList || []).filter(
      (opportunity) => opportunity.status === STATUS.opportunity.ACTIVE
    );

    if (activeOpportunities.length === 0) {
      setCapacityByOpportunityId({});
      return;
    }

    const results = await Promise.all(
      activeOpportunities.map(async (opportunity) => {
        const { data, error } = await supabaseStudent.rpc(
          "get_opportunity_capacity",
          {
            p_opportunity_id: opportunity.id,
          }
        );

        if (error) {
          console.error(
            `Error loading capacity for opportunity ${opportunity.id}:`,
            error
          );

          return {
            opportunityId: opportunity.id,
            capacity: null,
          };
        }

        const capacity = Array.isArray(data) ? data[0] : data;

        return {
          opportunityId: opportunity.id,
          capacity: capacity || null,
        };
      })
    );

    const capacityMap = results.reduce((map, item) => {
      map[item.opportunityId] = item.capacity;
      return map;
    }, {});

    setCapacityByOpportunityId(capacityMap);
  };

  // =========================================================
  // GET CAPACITY FOR OPPORTUNITY
  // =========================================================

  const getOpportunityCapacity = (targetOpportunityId) => {
    if (!targetOpportunityId) {
      return null;
    }

    return capacityByOpportunityId[targetOpportunityId] || null;
  };

  // =========================================================
  // CHECK IF OPPORTUNITY IS FULL
  // =========================================================

  const isOpportunityFull = (targetOpportunityId) => {
    const capacity = getOpportunityCapacity(targetOpportunityId);

    if (!capacity) {
      return false;
    }

    return Number(capacity.available_slots) <= 0;
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // GET STUDENT
      // -------------------------------------------------------

      const { data: studentData, error: studentError } = await supabaseStudent
        .from("students")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      if (!studentData) {
        throw new Error("No student profile was found for your account.");
      }

      setStudent(studentData);

      // -------------------------------------------------------
      // LOAD APPLICATIONS
      //
      // Applications are loaded independently from opportunity
      // availability. A closed opportunity must NOT hide an
      // existing student application.
      // -------------------------------------------------------

      const { data: applicationData, error: applicationError } =
        await supabaseStudent
          .from("applications")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (applicationError) {
        throw applicationError;
      }

      const loadedApplications = applicationData || [];

      setApplications(loadedApplications);

      // -------------------------------------------------------
      // LOAD ALL ASSIGNMENTS
      // -------------------------------------------------------

      const { data: assignmentData, error: assignmentError } =
        await supabaseStudent
          .from("assignments")
          .select(
            `
            id,
            application_id,
            student_id,
            opportunity_id,
            company_id,
            status,
            start_date,
            end_date,
            deployed_at,
            created_at,
            updated_at
          `
          )
          .eq("student_id", user.id)
          .in("status", [
            STATUS.assignment.PENDING,
            STATUS.assignment.ACTIVE,
            STATUS.assignment.COMPLETED,
            STATUS.assignment.SUSPENDED,
            STATUS.assignment.TERMINATED,
          ])
          .order("created_at", {
            ascending: false,
          });

      if (assignmentError) {
        throw assignmentError;
      }

      const loadedAssignments = assignmentData || [];

      setAssignments(loadedAssignments);

      // -------------------------------------------------------
      // LOAD ACTIVE OPPORTUNITIES
      //
      // These are the opportunities available for NEW
      // applications.
      // -------------------------------------------------------

      const { data: activeOpportunityData, error: activeOpportunityError } =
        await supabaseStudent
          .from("opportunities")
          .select("*")
          .eq("status", STATUS.opportunity.ACTIVE)
          .order("created_at", {
            ascending: false,
          });

      if (activeOpportunityError) {
        throw activeOpportunityError;
      }

      const activeOpportunities = activeOpportunityData || [];

      // -------------------------------------------------------
      // GET OPPORTUNITIES REFERENCED BY EXISTING APPLICATIONS
      // AND ASSIGNMENTS
      //
      // Existing opportunities are loaded even if CLOSED.
      // -------------------------------------------------------

      const existingOpportunityIds = [
        ...new Set(
          [
            ...loadedApplications.map(
              (application) => application.opportunity_id
            ),
            ...loadedAssignments.map((assignment) => assignment.opportunity_id),
          ].filter(Boolean)
        ),
      ];

      let existingOpportunities = [];

      if (existingOpportunityIds.length > 0) {
        const {
          data: existingOpportunityData,
          error: existingOpportunityError,
        } = await supabaseStudent
          .from("opportunities")
          .select("*")
          .in("id", existingOpportunityIds);

        if (existingOpportunityError) {
          throw existingOpportunityError;
        }

        existingOpportunities = existingOpportunityData || [];
      }

      // -------------------------------------------------------
      // MERGE ACTIVE + EXISTING OPPORTUNITIES
      // -------------------------------------------------------

      const opportunityMap = new Map();

      activeOpportunities.forEach((opportunity) => {
        opportunityMap.set(opportunity.id, opportunity);
      });

      existingOpportunities.forEach((opportunity) => {
        opportunityMap.set(opportunity.id, opportunity);
      });

      const loadedOpportunities = Array.from(opportunityMap.values());

      // -------------------------------------------------------
      // LOAD COMPANIES
      // -------------------------------------------------------

      const companyIds = [
        ...new Set(
          loadedOpportunities
            .map((opportunity) => opportunity.company_id)
            .filter(Boolean)
        ),
      ];

      let companyMap = {};

      if (companyIds.length > 0) {
        const { data: companyData, error: companyError } = await supabaseStudent
          .from("companies")
          .select(
            `
                id,
                company_name,
                company_address,
                industry,
                status
              `
          )
          .in("id", companyIds);

        if (companyError) {
          throw companyError;
        }

        companyMap = (companyData || []).reduce((map, company) => {
          map[company.id] = company;
          return map;
        }, {});
      }

      // -------------------------------------------------------
      // ATTACH COMPANIES
      // -------------------------------------------------------

      const opportunitiesWithCompanies = loadedOpportunities.map(
        (opportunity) => ({
          ...opportunity,
          companies: companyMap[opportunity.company_id] || null,
        })
      );

      setOpportunities(opportunitiesWithCompanies);

      // -------------------------------------------------------
      // LOAD CAPACITY
      //
      // Only ACTIVE opportunities need capacity for the Apply
      // page. Historical CLOSED opportunities do not need it.
      // -------------------------------------------------------

      await loadOpportunityCapacities(opportunitiesWithCompanies);

      // -------------------------------------------------------
      // DEFAULT SELECTED OPPORTUNITY
      // -------------------------------------------------------

      const defaultActiveOpportunity = opportunitiesWithCompanies.find(
        (opportunity) => opportunity.status === STATUS.opportunity.ACTIVE
      );

      if (defaultActiveOpportunity) {
        setOpportunityId(defaultActiveOpportunity.id);
      } else if (opportunitiesWithCompanies.length > 0) {
        setOpportunityId(opportunitiesWithCompanies[0].id);
      } else {
        setOpportunityId("");
      }
    } catch (error) {
      console.error("Error loading student internship data:", error);

      alert(error.message || "Unable to load internship opportunities.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ASSIGNMENT HELPERS
  // =========================================================

  const latestAssignment = assignments[0] || null;

  const assignmentByApplicationId = useMemo(() => {
    return assignments.reduce((map, assignment) => {
      if (assignment.application_id) {
        map[assignment.application_id] = assignment;
      }

      return map;
    }, {});
  }, [assignments]);

  // ---------------------------------------------------------
  // ACTIVE PLACEMENT
  // ---------------------------------------------------------

  const activePlacementAssignment = useMemo(() => {
    return (
      assignments.find((item) =>
        [STATUS.assignment.PENDING, STATUS.assignment.ACTIVE].includes(
          item.status
        )
      ) || null
    );
  }, [assignments]);

  const hasActiveAssignment = Boolean(activePlacementAssignment);

  // ---------------------------------------------------------
  // COMPLETED PLACEMENT
  //
  // HISTORY ONLY.
  // ---------------------------------------------------------

  const completedPlacement = useMemo(() => {
    return (
      assignments.find(
        (assignment) => assignment.status === STATUS.assignment.COMPLETED
      ) || null
    );
  }, [assignments]);

  const hasCompletedPlacement = Boolean(completedPlacement);

  // ---------------------------------------------------------
  // ANY ASSIGNMENT
  // ---------------------------------------------------------

  const hasAnyAssignment = assignments.length > 0;

  // ---------------------------------------------------------
  // CHECK COMPLETED PLACEMENT FOR SPECIFIC OPPORTUNITY
  // ---------------------------------------------------------

  const hasCompletedPlacementForOpportunity = (targetOpportunityId) => {
    if (!targetOpportunityId) {
      return false;
    }

    return assignments.some(
      (assignment) =>
        assignment.opportunity_id === targetOpportunityId &&
        assignment.status === STATUS.assignment.COMPLETED
    );
  };

  // =========================================================
  // SELECTED OPPORTUNITY
  // =========================================================

  const selectedOpportunity = opportunities.find(
    (item) => item.id === opportunityId
  );

  // =========================================================
  // SELECTED OPPORTUNITY AVAILABILITY
  // =========================================================

  const selectedOpportunityIsActive =
    selectedOpportunity?.status === STATUS.opportunity.ACTIVE;

  const selectedOpportunityCapacity = getOpportunityCapacity(opportunityId);

  const selectedOpportunityIsFull =
    selectedOpportunityIsActive &&
    selectedOpportunityCapacity &&
    Number(selectedOpportunityCapacity.available_slots) <= 0;

  // =========================================================
  // APPLICATIONS FOR SELECTED OPPORTUNITY
  // =========================================================

  const opportunityApplications = applications
    .filter((application) => application.opportunity_id === opportunityId)
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();

      const dateB = new Date(b.created_at || 0).getTime();

      return dateB - dateA;
    });

  const existingApplication =
    opportunityApplications.find(
      (application) =>
        application.status !== STATUS.application.WITHDRAWN &&
        application.status !== STATUS.application.REJECTED
    ) || opportunityApplications[0];

  // =========================================================
  // GLOBAL APPLICATION STATUS
  // =========================================================

  const approvedApplication = useMemo(() => {
    return (
      applications.find((application) => {
        if (application.status !== STATUS.application.APPROVED) {
          return false;
        }

        const relatedAssignment = assignmentByApplicationId[application.id];

        return !relatedAssignment;
      }) || null
    );
  }, [applications, assignmentByApplicationId]);

  const hasPlacementOffer = Boolean(approvedApplication);

  // =========================================================
  // RESUME / CV REQUIREMENT
  // =========================================================

  const hasResume = Boolean(student?.resume_url);

  // ---------------------------------------------------------
  // LEGACY ACCEPTED APPLICATION
  // ---------------------------------------------------------

  const acceptedApplication = applications.find(
    (application) => application.status === STATUS.application.ACCEPTED
  );

  const hasAcceptedApplication = Boolean(acceptedApplication);

  // ---------------------------------------------------------
  // FINAL PLACEMENT
  // ---------------------------------------------------------

  const hasFinalPlacement =
    hasActiveAssignment || hasAcceptedApplication || hasCompletedPlacement;

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not specified";
    }

    const dateString = String(date).split("T")[0];
    const parts = dateString.split("-");

    if (parts.length === 3) {
      const [year, month, day] = parts;

      const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not specified";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // =========================================================
  // FORMAT DATE/TIME
  // =========================================================

  const formatDateTime = (date) => {
    if (!date) {
      return "Not specified";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not specified";
    }

    return parsedDate.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =========================================================
  // FORMAT INTERNSHIP PERIOD
  // =========================================================

  const formatInternshipPeriod = (opportunity) => {
    if (!opportunity) {
      return "Not specified";
    }

    const start =
      opportunity.internship_start_date || opportunity.internship_start;

    const end = opportunity.internship_end_date || opportunity.internship_end;

    if (start && end) {
      return `${formatDate(start)} – ${formatDate(end)}`;
    }

    if (start) {
      return `${formatDate(start)} – Not specified`;
    }

    if (end) {
      return `Not specified – ${formatDate(end)}`;
    }

    return opportunity.availability || "Not specified";
  };

  // =========================================================
  // FORMAT STATUS
  // =========================================================

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // =========================================================
  // REJECTION INFO
  // =========================================================

  const getRejectionInfo = (application) => {
    const notes = application?.notes?.trim() || "";

    if (notes.includes("Company rejected the internship placement.")) {
      const reasonIndex = notes.lastIndexOf("Reason:");

      return {
        source: "Company",
        reason:
          reasonIndex !== -1
            ? notes.substring(reasonIndex + "Reason:".length).trim()
            : notes,
      };
    }

    return {
      source: "Registrar",
      reason: notes || "No rejection reason was provided.",
    };
  };

  // =========================================================
  // STATUS TONE
  // =========================================================

  const statusTone = (status) => {
    switch (status) {
      case STATUS.application.ACCEPTED:
        return "text-emerald-600";

      case STATUS.application.APPROVED:
        return "text-blue-600";

      case STATUS.application.REJECTED:
        return "text-red-600";

      case STATUS.application.SUBMITTED:
        return "text-blue-600";

      case STATUS.application.UNDER_REVIEW:
        return "text-amber-600";

      case STATUS.application.INFO_REQUESTED:
        return "text-orange-600";

      case STATUS.application.WITHDRAWN:
        return "text-slate-500";

      case STATUS.application.DRAFT:
        return "text-slate-500";

      default:
        return "text-amber-600";
    }
  };

  // =========================================================
  // ASSIGNMENT STATUS DISPLAY
  // =========================================================

  const getAssignmentStatusInfo = (assignment) => {
    if (!assignment) {
      return null;
    }

    switch (assignment.status) {
      case STATUS.assignment.PENDING:
        if (assignment.deployed_at) {
          return {
            title: "Waiting for Company Decision",
            description:
              "Your internship has been deployed to the company and is waiting for their decision.",
            icon: "⏳",
            tone: "blue",
          };
        }

        return {
          title: "Placement Confirmed",
          description:
            "You confirmed this internship placement. It is waiting for deployment.",
          icon: "✓",
          tone: "blue",
        };

      case STATUS.assignment.ACTIVE:
        return {
          title: "Internship Active",
          description:
            "The company accepted your placement. Your internship is now active.",
          icon: "🎉",
          tone: "emerald",
        };

      case STATUS.assignment.COMPLETED:
        return {
          title: "Internship Completed",
          description:
            "Your internship placement has been completed successfully.",
          icon: "🎓",
          tone: "emerald",
        };

      case STATUS.assignment.SUSPENDED:
        return {
          title: "Internship Suspended",
          description: "Your internship placement is currently suspended.",
          icon: "⏸️",
          tone: "amber",
        };

      case STATUS.assignment.TERMINATED:
        return {
          title: "Placement Terminated",
          description: "This internship placement has been terminated.",
          icon: "⚠️",
          tone: "red",
        };

      default:
        return {
          title: formatStatus(assignment.status),
          description: "Your internship placement has been updated.",
          icon: "ℹ️",
          tone: "blue",
        };
    }
  };

  // =========================================================
  // APPLY AGAIN ELIGIBILITY
  // =========================================================

  const canApplyAgain = (targetOpportunityId) => {
    if (!targetOpportunityId) {
      return false;
    }

    const targetOpportunity = opportunities.find(
      (opportunity) => opportunity.id === targetOpportunityId
    );

    // New application must target ACTIVE.
    if (
      !targetOpportunity ||
      targetOpportunity.status !== STATUS.opportunity.ACTIVE
    ) {
      return false;
    }

    // Current placement blocks another application.
    if (hasActiveAssignment) {
      return false;
    }

    // Pending placement offer blocks another application.
    if (hasPlacementOffer) {
      return false;
    }

    // Do not reapply to the exact opportunity
    // already completed.
    if (hasCompletedPlacementForOpportunity(targetOpportunityId)) {
      return false;
    }

    // -------------------------------------------------------
    // CAPACITY CHECK
    // -------------------------------------------------------

    const capacity = getOpportunityCapacity(targetOpportunityId);

    if (capacity && Number(capacity.available_slots) <= 0) {
      return false;
    }

    return true;
  };

  // =========================================================
  // SELECT OPPORTUNITY
  // =========================================================

  const handleSelectOpportunity = (opportunity) => {
    if (!opportunity) {
      return;
    }

    setOpportunityId(opportunity.id);
    setIsReapplying(false);

    const selectedApplications = applications
      .filter((item) => item.opportunity_id === opportunity.id)
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();

        const dateB = new Date(b.created_at || 0).getTime();

        return dateB - dateA;
      });

    const application = selectedApplications.find(
      (item) =>
        item.status !== STATUS.application.WITHDRAWN &&
        item.status !== STATUS.application.REJECTED
    );

    if (
      application?.status === STATUS.application.DRAFT ||
      application?.status === STATUS.application.INFO_REQUESTED
    ) {
      setCoverLetter(application.cover_letter || "");
    } else {
      setCoverLetter("");
    }
  };

  // =========================================================
  // CONFIRM PLACEMENT
  // =========================================================

  const handleConfirmPlacement = async (application) => {
    if (!application) {
      return;
    }

    if (application.status !== STATUS.application.APPROVED) {
      alert("This application is no longer waiting for confirmation.");
      return;
    }

    const existingAssignment = assignmentByApplicationId[application.id];

    if (existingAssignment) {
      alert("This internship placement has already been confirmed.");
      return;
    }

    if (hasActiveAssignment) {
      alert("You already have a confirmed internship placement.");
      return;
    }

    const opportunity = opportunities.find(
      (item) => item.id === application.opportunity_id
    );

    if (!opportunity) {
      alert(
        "The internship opportunity associated with this application could not be loaded."
      );
      return;
    }

    const companyName = opportunity?.companies?.company_name || "this company";

    const opportunityTitle =
      opportunity?.title || "this internship opportunity";

    const confirmed = window.confirm(
      `Confirm your internship placement with ${companyName}?\n\n` +
        `${opportunityTitle}\n\n` +
        `Once confirmed, an internship assignment will be created and your other active applications will be withdrawn.`
    );

    if (!confirmed) {
      return;
    }

    setIsConfirmingPlacement(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { data: newAssignment, error: rpcError } =
        await supabaseStudent.rpc("confirm_internship_application", {
          p_application_id: application.id,
        });

      if (rpcError) {
        throw rpcError;
      }

      const createdAssignment = Array.isArray(newAssignment)
        ? newAssignment[0]
        : newAssignment;

      if (!createdAssignment) {
        throw new Error(
          "The internship placement was confirmed, but no assignment was returned."
        );
      }

      await loadData();

      setActiveTab("status");

      alert(
        "Internship placement confirmed successfully. Your assignment has been created."
      );
    } catch (error) {
      console.error("Error confirming internship placement:", error);

      alert(
        error.message ||
          "Unable to confirm the internship placement. Please try again."
      );
    } finally {
      setIsConfirmingPlacement(false);
    }
  };

  // =========================================================
  // DECLINE PLACEMENT
  // =========================================================

  const handleDeclinePlacement = async (application) => {
    if (!application) {
      return;
    }

    if (application.status !== STATUS.application.APPROVED) {
      alert("This application is no longer waiting for confirmation.");
      return;
    }

    const existingAssignment = assignmentByApplicationId[application.id];

    if (existingAssignment) {
      alert(
        "This internship placement has already been confirmed and can no longer be declined."
      );
      return;
    }

    const opportunity = opportunities.find(
      (item) => item.id === application.opportunity_id
    );

    if (!opportunity) {
      alert(
        "The internship opportunity associated with this application could not be loaded."
      );
      return;
    }

    const companyName = opportunity?.companies?.company_name || "this company";

    const confirmed = window.confirm(
      `Decline the internship placement offered by ${companyName}?\n\n` +
        `Your other applications will remain available for review.`
    );

    if (!confirmed) {
      return;
    }

    setIsConfirmingPlacement(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { data: declinedApplication, error: rpcError } =
        await supabaseStudent.rpc("decline_internship_placement", {
          p_application_id: application.id,
        });

      if (rpcError) {
        throw rpcError;
      }

      const updatedApplication = Array.isArray(declinedApplication)
        ? declinedApplication[0]
        : declinedApplication;

      if (updatedApplication) {
        setApplications((previous) =>
          previous.map((item) =>
            item.id === updatedApplication.id ? updatedApplication : item
          )
        );
      }

      setActiveTab("status");

      alert(
        "Placement declined. Your other internship applications remain available."
      );
    } catch (error) {
      console.error("Error declining internship placement:", error);

      alert(
        error.message ||
          "Unable to decline the internship placement. Please try again."
      );
    } finally {
      setIsConfirmingPlacement(false);
    }
  };

  // =========================================================
  // RESUBMIT INFORMATION REQUEST
  // =========================================================

  const handleResubmitInformation = async () => {
    if (!student) {
      alert("Student profile could not be loaded.");
      return;
    }

    if (!selectedOpportunity) {
      alert("The selected internship opportunity could not be found.");
      return;
    }

    if (!hasResume) {
      alert(
        "Please upload your Resume/CV in your Student Profile before submitting an internship application."
      );
      return;
    }

    if (!existingApplication) {
      alert("The application could not be found.");
      return;
    }

    if (existingApplication.status !== STATUS.application.INFO_REQUESTED) {
      alert("This application is not waiting for additional information.");
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please update your application before resubmitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { data: updatedApplication, error: updateError } =
        await supabaseStudent
          .from("applications")
          .update({
            cover_letter: coverLetter.trim(),
            status: STATUS.application.SUBMITTED,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingApplication.id)
          .eq("student_id", user.id)
          .select()
          .single();

      if (updateError) {
        throw updateError;
      }

      setApplications((previous) =>
        previous.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application
        )
      );

      setCoverLetter("");

      alert(
        `Application resubmitted successfully for ${selectedOpportunity.title}.`
      );

      setActiveTab("status");
    } catch (error) {
      console.error("Error resubmitting application:", error);

      alert(
        error.message ||
          "Unable to resubmit your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // APPLY AGAIN
  // =========================================================

  const handleApplyAgain = (opportunity) => {
    if (!opportunity) {
      return;
    }

    if (opportunity.status !== STATUS.opportunity.ACTIVE) {
      alert(
        "This internship opportunity is closed and is no longer accepting new applications."
      );
      return;
    }

    if (hasCompletedPlacementForOpportunity(opportunity.id)) {
      alert("You have already completed your internship for this opportunity.");
      return;
    }

    if (hasActiveAssignment) {
      alert(
        "You already have a confirmed internship placement. You cannot apply to another opportunity."
      );
      return;
    }

    if (hasPlacementOffer) {
      alert(
        "You currently have an internship placement offer waiting for your confirmation. Please confirm or decline that offer before applying again."
      );
      return;
    }

    // -------------------------------------------------------
    // CAPACITY CHECK
    // -------------------------------------------------------

    const capacity = getOpportunityCapacity(opportunity.id);

    if (capacity && Number(capacity.available_slots) <= 0) {
      alert(
        "This internship opportunity is currently full. No available slot remains."
      );
      return;
    }

    setOpportunityId(opportunity.id);
    setCoverLetter("");
    setIsReapplying(true);
    setActiveTab("apply");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // SUBMIT APPLICATION
  // =========================================================

  const handleSubmitApplication = async () => {
    if (!student) {
      alert("Student profile could not be loaded.");
      return;
    }

    if (!hasResume) {
      alert(
        "Please upload your Resume/CV in your Student Profile before submitting an internship application."
      );
      return;
    }

    if (!selectedOpportunity) {
      alert("Please select an internship opportunity.");
      return;
    }

    // -------------------------------------------------------
    // NEW APPLICATION ON CLOSED OPPORTUNITY
    // -------------------------------------------------------

    if (
      selectedOpportunity.status !== STATUS.opportunity.ACTIVE &&
      isReapplying
    ) {
      alert(
        "This internship opportunity is closed and cannot accept a new application."
      );
      return;
    }

    // -------------------------------------------------------
    // EXISTING APPLICATION MAINTENANCE
    // -------------------------------------------------------

    if (
      existingApplication?.status === STATUS.application.INFO_REQUESTED &&
      !isReapplying
    ) {
      await handleResubmitInformation();
      return;
    }

    if (
      existingApplication?.status === STATUS.application.DRAFT &&
      !isReapplying
    ) {
      await handleSubmitDraft();
      return;
    }

    // -------------------------------------------------------
    // BRAND-NEW APPLICATIONS REQUIRE ACTIVE OPPORTUNITY
    // -------------------------------------------------------

    if (selectedOpportunity.status !== STATUS.opportunity.ACTIVE) {
      alert(
        "This internship opportunity is closed and is no longer accepting new applications."
      );
      return;
    }

    // -------------------------------------------------------
    // ACTIVE PLACEMENT RESTRICTION
    // -------------------------------------------------------

    if (hasActiveAssignment) {
      alert(
        "You already have a confirmed internship placement. You cannot apply to another opportunity."
      );
      return;
    }

    // -------------------------------------------------------
    // PLACEMENT OFFER RESTRICTION
    // -------------------------------------------------------

    if (
      hasPlacementOffer &&
      approvedApplication?.id !== existingApplication?.id
    ) {
      alert(
        "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer before submitting another application."
      );
      return;
    }

    // -------------------------------------------------------
    // DUPLICATE APPLICATION
    // -------------------------------------------------------

    if (
      existingApplication &&
      ![
        STATUS.application.REJECTED,
        STATUS.application.DRAFT,
        STATUS.application.INFO_REQUESTED,
        STATUS.application.WITHDRAWN,
      ].includes(existingApplication.status) &&
      !isReapplying
    ) {
      alert(
        `You already have an active application for ${selectedOpportunity.title}.`
      );
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please provide a cover letter before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // FINAL APPLICATION CHECK
      // -------------------------------------------------------

      const { data: latestApplications, error: latestApplicationsError } =
        await supabaseStudent
          .from("applications")
          .select("id, status, opportunity_id")
          .eq("student_id", user.id);

      if (latestApplicationsError) {
        throw latestApplicationsError;
      }

      // -------------------------------------------------------
      // FINAL ASSIGNMENT CHECK
      // -------------------------------------------------------

      const { data: latestAssignments, error: latestAssignmentError } =
        await supabaseStudent
          .from("assignments")
          .select("id, application_id, opportunity_id, status")
          .eq("student_id", user.id);

      if (latestAssignmentError) {
        throw latestAssignmentError;
      }

      const finalAssignments = latestAssignments || [];

      // -------------------------------------------------------
      // ONLY PENDING + ACTIVE BLOCK
      // -------------------------------------------------------

      const finalHasActiveAssignment = finalAssignments.some(
        (assignment) =>
          assignment.status === STATUS.assignment.PENDING ||
          assignment.status === STATUS.assignment.ACTIVE
      );

      const latestHasPlacementOffer = (latestApplications || []).some(
        (application) =>
          application.status === STATUS.application.APPROVED &&
          !finalAssignments.some(
            (assignment) => assignment.application_id === application.id
          )
      );

      if (finalHasActiveAssignment) {
        throw new Error(
          "You already have a confirmed internship placement. You cannot apply to another opportunity."
        );
      }

      if (latestHasPlacementOffer) {
        throw new Error(
          "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer before submitting another application."
        );
      }

      // -------------------------------------------------------
      // FINAL OPPORTUNITY STATUS CHECK
      // -------------------------------------------------------

      const { data: latestOpportunity, error: latestOpportunityError } =
        await supabaseStudent
          .from("opportunities")
          .select("id, status")
          .eq("id", selectedOpportunity.id)
          .maybeSingle();

      if (latestOpportunityError) {
        throw latestOpportunityError;
      }

      if (!latestOpportunity) {
        throw new Error(
          "The selected internship opportunity could not be found."
        );
      }

      if (latestOpportunity.status !== STATUS.opportunity.ACTIVE) {
        throw new Error(
          "This internship opportunity has been closed and is no longer accepting new applications."
        );
      }

      // -------------------------------------------------------
      // FINAL CAPACITY CHECK
      //
      // IMPORTANT:
      // Capacity may have changed after the page loaded.
      // This checks the database again immediately before
      // creating the new application.
      // -------------------------------------------------------

      const { data: latestCapacityData, error: latestCapacityError } =
        await supabaseStudent.rpc("get_opportunity_capacity", {
          p_opportunity_id: selectedOpportunity.id,
        });

      if (latestCapacityError) {
        throw latestCapacityError;
      }

      const latestCapacity = Array.isArray(latestCapacityData)
        ? latestCapacityData[0]
        : latestCapacityData;

      if (!latestCapacity) {
        throw new Error(
          "Unable to verify the available slots for this internship opportunity."
        );
      }

      if (Number(latestCapacity.available_slots) <= 0) {
        setCapacityByOpportunityId((previous) => ({
          ...previous,
          [selectedOpportunity.id]: latestCapacity,
        }));

        throw new Error(
          "This internship opportunity is now full. No available slot remains."
        );
      }

      // -------------------------------------------------------
      // CREATE APPLICATION
      // -------------------------------------------------------

      const { data: newApplication, error: insertError } = await supabaseStudent
        .from("applications")
        .insert({
          student_id: user.id,
          opportunity_id: selectedOpportunity.id,
          cover_letter: coverLetter.trim(),
          status: STATUS.application.SUBMITTED,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          console.error("DUPLICATE APPLICATION ERROR:", insertError);

          throw new Error(
            `Duplicate application error: ${insertError.message}`
          );
        }

        throw insertError;
      }

      setApplications((previous) => [newApplication, ...previous]);

      setCoverLetter("");
      setIsReapplying(false);

      alert(
        `Application submitted successfully for ${selectedOpportunity.title}.`
      );

      setActiveTab("status");
    } catch (error) {
      console.error("Error submitting application:", error);

      alert(
        error.message || "Unable to submit your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // SUBMIT EXISTING DRAFT
  // =========================================================

  const handleSubmitDraft = async () => {
    if (!student || !selectedOpportunity || !existingApplication) {
      return;
    }

    if (!hasResume) {
      alert(
        "Please upload your Resume/CV in your Student Profile before submitting an internship application."
      );
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please provide a cover letter before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // ACTIVE ASSIGNMENT CHECK
      // -------------------------------------------------------

      const { data: latestAssignment, error: latestAssignmentError } =
        await supabaseStudent
          .from("assignments")
          .select("id, status")
          .eq("student_id", user.id)
          .in("status", [STATUS.assignment.PENDING, STATUS.assignment.ACTIVE])
          .limit(1)
          .maybeSingle();

      if (latestAssignmentError) {
        throw latestAssignmentError;
      }

      const { data: latestApplications, error: latestApplicationsError } =
        await supabaseStudent
          .from("applications")
          .select("id, status")
          .eq("student_id", user.id);

      if (latestApplicationsError) {
        throw latestApplicationsError;
      }

      const hasApprovedOffer = (latestApplications || []).some(
        (application) =>
          application.status === STATUS.application.APPROVED &&
          !assignmentByApplicationId[application.id]
      );

      if (latestAssignment) {
        throw new Error("You already have a confirmed internship placement.");
      }

      if (
        hasApprovedOffer &&
        existingApplication.status !== STATUS.application.APPROVED
      ) {
        throw new Error(
          "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer first."
        );
      }

      // -------------------------------------------------------
      // EXISTING DRAFT CAN CONTINUE EVEN IF OPPORTUNITY CLOSED
      // -------------------------------------------------------

      const { data: updatedApplication, error: updateError } =
        await supabaseStudent
          .from("applications")
          .update({
            cover_letter: coverLetter.trim(),
            status: STATUS.application.SUBMITTED,
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingApplication.id)
          .eq("student_id", user.id)
          .select()
          .single();

      if (updateError) {
        throw updateError;
      }

      setApplications((previous) =>
        previous.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application
        )
      );

      setCoverLetter("");

      alert(
        `Application submitted successfully for ${selectedOpportunity.title}.`
      );

      setActiveTab("status");
    } catch (error) {
      console.error("Error submitting draft:", error);

      alert(error.message || "Unable to submit your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // SAVE DRAFT
  // =========================================================

  const handleSaveDraft = async () => {
    if (!student) {
      alert("Student profile could not be loaded.");
      return;
    }

    if (!selectedOpportunity) {
      alert("Please select an internship opportunity.");
      return;
    }

    if (!coverLetter.trim()) {
      alert("Please write something before saving the draft.");
      return;
    }

    // -------------------------------------------------------
    // EXISTING DRAFT
    // -------------------------------------------------------

    if (existingApplication?.status === STATUS.application.DRAFT) {
      setIsSubmitting(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabaseStudent.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("You are not logged in.");
        }

        const { data: updatedApplication, error: updateError } =
          await supabaseStudent
            .from("applications")
            .update({
              cover_letter: coverLetter.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingApplication.id)
            .eq("student_id", user.id)
            .select()
            .single();

        if (updateError) {
          throw updateError;
        }

        setApplications((previous) =>
          previous.map((application) =>
            application.id === updatedApplication.id
              ? updatedApplication
              : application
          )
        );

        alert("Application draft updated successfully.");
      } catch (error) {
        console.error("Error updating application draft:", error);

        alert(error.message || "Unable to update your application draft.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    // -------------------------------------------------------
    // REJECTED / WITHDRAWN
    // -------------------------------------------------------

    if (
      existingApplication?.status === STATUS.application.REJECTED ||
      existingApplication?.status === STATUS.application.WITHDRAWN
    ) {
      if (hasActiveAssignment) {
        alert(
          "You already have a confirmed internship placement. You cannot create another application."
        );
        return;
      }

      if (hasPlacementOffer) {
        alert(
          "You have an internship placement offer waiting for confirmation. Please decide on that offer first."
        );
        return;
      }

      if (selectedOpportunity.status !== STATUS.opportunity.ACTIVE) {
        alert(
          "This internship opportunity is closed and is no longer accepting new applications."
        );
        return;
      }

      alert("Please use 'Apply Again' to create a new application.");
      return;
    }

    // -------------------------------------------------------
    // INFORMATION REQUESTED
    // -------------------------------------------------------

    if (existingApplication?.status === STATUS.application.INFO_REQUESTED) {
      alert(
        "Please use 'Resubmit Application' after updating your application."
      );
      return;
    }

    // -------------------------------------------------------
    // NEW DRAFT REQUIRES ACTIVE OPPORTUNITY
    // -------------------------------------------------------

    if (selectedOpportunity.status !== STATUS.opportunity.ACTIVE) {
      alert(
        "This internship opportunity is closed and is no longer accepting new applications."
      );
      return;
    }

    // -------------------------------------------------------
    // ACTIVE PLACEMENT
    // -------------------------------------------------------

    if (hasActiveAssignment) {
      alert(
        "You already have a confirmed internship placement. You cannot create another application."
      );
      return;
    }

    // -------------------------------------------------------
    // PENDING OFFER
    // -------------------------------------------------------

    if (hasPlacementOffer) {
      alert(
        "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer first."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabaseStudent.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // -------------------------------------------------------
      // FINAL CHECK
      // -------------------------------------------------------

      const { data: latestApplications, error: latestApplicationsError } =
        await supabaseStudent
          .from("applications")
          .select("id, status")
          .eq("student_id", user.id);

      if (latestApplicationsError) {
        throw latestApplicationsError;
      }

      const { data: latestAssignments, error: latestAssignmentError } =
        await supabaseStudent
          .from("assignments")
          .select("id, application_id, status")
          .eq("student_id", user.id);

      if (latestAssignmentError) {
        throw latestAssignmentError;
      }

      const latestActiveAssignment = (latestAssignments || []).find(
        (assignment) =>
          assignment.status === STATUS.assignment.PENDING ||
          assignment.status === STATUS.assignment.ACTIVE
      );

      const hasApproved = (latestApplications || []).some(
        (application) =>
          application.status === STATUS.application.APPROVED &&
          !(latestAssignments || []).some(
            (assignment) => assignment.application_id === application.id
          )
      );

      if (latestActiveAssignment) {
        throw new Error(
          "You already have a confirmed internship placement. You cannot create another application."
        );
      }

      if (hasApproved) {
        throw new Error(
          "You have an internship placement offer waiting for confirmation. Please confirm or decline that offer first."
        );
      }

      // -------------------------------------------------------
      // FINAL OPPORTUNITY STATUS CHECK
      // -------------------------------------------------------

      const { data: latestOpportunity, error: latestOpportunityError } =
        await supabaseStudent
          .from("opportunities")
          .select("id, status")
          .eq("id", selectedOpportunity.id)
          .maybeSingle();

      if (latestOpportunityError) {
        throw latestOpportunityError;
      }

      if (!latestOpportunity) {
        throw new Error(
          "The selected internship opportunity could not be found."
        );
      }

      if (latestOpportunity.status !== STATUS.opportunity.ACTIVE) {
        throw new Error(
          "This internship opportunity has been closed and is no longer accepting new applications."
        );
      }

      // -------------------------------------------------------
      // FINAL CAPACITY CHECK
      // -------------------------------------------------------

      const { data: latestCapacityData, error: latestCapacityError } =
        await supabaseStudent.rpc("get_opportunity_capacity", {
          p_opportunity_id: selectedOpportunity.id,
        });

      if (latestCapacityError) {
        throw latestCapacityError;
      }

      const latestCapacity = Array.isArray(latestCapacityData)
        ? latestCapacityData[0]
        : latestCapacityData;

      if (!latestCapacity) {
        throw new Error(
          "Unable to verify the available slots for this internship opportunity."
        );
      }

      if (Number(latestCapacity.available_slots) <= 0) {
        setCapacityByOpportunityId((previous) => ({
          ...previous,
          [selectedOpportunity.id]: latestCapacity,
        }));

        throw new Error(
          "This internship opportunity is now full. No available slot remains."
        );
      }

      // -------------------------------------------------------
      // CREATE DRAFT
      // -------------------------------------------------------

      const { data: newDraft, error: insertError } = await supabaseStudent
        .from("applications")
        .insert({
          student_id: user.id,
          opportunity_id: selectedOpportunity.id,
          cover_letter: coverLetter.trim(),
          status: STATUS.application.DRAFT,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          console.error("DUPLICATE APPLICATION ERROR:", insertError);

          throw new Error(
            `Duplicate application error: ${insertError.message}`
          );
        }

        throw insertError;
      }

      setApplications((previous) => [newDraft, ...previous]);

      alert("Application draft saved successfully.");
    } catch (error) {
      console.error("Error saving application draft:", error);

      alert(error.message || "Unable to save your application draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // OPEN STATUS PAGE
  // =========================================================

  const handleViewStatusPage = () => {
    navigate("/student/status");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${
          darkMode ? "text-slate-100" : "text-slate-900"
        }`}
      >
        <div
          className={`border rounded-2xl p-10 text-center ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="text-2xl mb-3">⏳</div>

          <h3 className="font-bold">Loading internship opportunities...</h3>

          <p className="text-sm mt-1 text-slate-500">
            Please wait while we load available opportunities.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <div
      className={`p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto ${
        darkMode ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest font-bold text-slate-400">
          Student Portal
        </p>

        <h1 className="text-2xl font-black">Internship Application</h1>

        <p
          className={`text-sm mt-1 ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Browse internship opportunities, manage your applications, and track
          your placement.
        </p>
      </div>

      {/* =====================================================
          TABS
      ===================================================== */}

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
                ? darkMode
                  ? "bg-slate-700 text-white shadow-sm"
                  : "bg-white text-slate-900 shadow-sm"
                : darkMode
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {tab === "apply" ? "Apply" : "View Status"}
          </button>
        ))}
      </div>

      {/* =====================================================
          APPLY TAB
      ===================================================== */}

      {activeTab === "apply" ? (
        <section
          className={`border rounded-2xl p-5 md:p-6 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {/* =================================================
              CURRENT PLACEMENT STATUS
          ================================================= */}

          {latestAssignment &&
            (() => {
              const statusInfo = getAssignmentStatusInfo(latestAssignment);

              if (!statusInfo) {
                return null;
              }

              const toneClasses = {
                emerald: darkMode
                  ? "border-emerald-800 bg-emerald-950/30"
                  : "border-emerald-200 bg-emerald-50",

                blue: darkMode
                  ? "border-blue-800 bg-blue-950/30"
                  : "border-blue-200 bg-blue-50",

                amber: darkMode
                  ? "border-amber-800 bg-amber-950/30"
                  : "border-amber-200 bg-amber-50",

                red: darkMode
                  ? "border-red-800 bg-red-950/30"
                  : "border-red-200 bg-red-50",
              };

              const textClasses = {
                emerald: darkMode ? "text-emerald-200" : "text-emerald-800",

                blue: darkMode ? "text-blue-200" : "text-blue-800",

                amber: darkMode ? "text-amber-200" : "text-amber-800",

                red: darkMode ? "text-red-200" : "text-red-800",
              };

              return (
                <div
                  className={`mb-5 border rounded-xl p-4 ${
                    toneClasses[statusInfo.tone]
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">{statusInfo.icon}</div>

                    <div className="flex-1">
                      <p
                        className={`text-xs font-bold ${
                          statusInfo.tone === "emerald"
                            ? "text-emerald-600"
                            : statusInfo.tone === "blue"
                            ? "text-blue-600"
                            : statusInfo.tone === "amber"
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {statusInfo.title}
                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          textClasses[statusInfo.tone]
                        }`}
                      >
                        {statusInfo.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={handleViewStatusPage}
                          className={`px-4 py-2 rounded-lg text-xs font-bold ${
                            statusInfo.tone === "emerald"
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : statusInfo.tone === "red"
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : statusInfo.tone === "amber"
                              ? "bg-amber-600 text-white hover:bg-amber-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          View Internship Status →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* =================================================
              PLACEMENT OFFER NOTICE
          ================================================= */}

          {hasPlacementOffer && (
            <div
              className={`mb-5 border rounded-xl p-4 ${
                darkMode
                  ? "border-blue-800 bg-blue-950/30"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-lg">🎉</div>

                <div>
                  <p className="text-xs font-bold text-blue-600">
                    Internship Placement Offer Available
                  </p>

                  <p
                    className={`text-xs mt-1 ${
                      darkMode ? "text-blue-200" : "text-blue-800"
                    }`}
                  >
                    The Registrar approved one of your applications. Please go
                    to <strong>View Status</strong> to confirm or decline the
                    placement.
                  </p>

                  <button
                    type="button"
                    onClick={handleViewStatusPage}
                    className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                  >
                    Review Placement →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              ACTIVE OPPORTUNITIES
          ================================================= */}

          {opportunities.filter(
            (opportunity) => opportunity.status === STATUS.opportunity.ACTIVE
          ).length === 0 ? (
            <div
              className={`border rounded-xl p-8 text-center ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="text-3xl mb-3">📋</div>

              <h3 className="font-bold">
                No internship opportunities available
              </h3>

              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Please check again later for new internship opportunities.
              </p>
            </div>
          ) : (
            <>
              {/* =================================================
                  OPPORTUNITY CARDS
              ================================================= */}

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {opportunities
                  .filter(
                    (opportunity) =>
                      opportunity.status === STATUS.opportunity.ACTIVE
                  )
                  .map((opportunity) => {
                    const company = opportunity.companies;

                    const opportunityApplications = applications
                      .filter((item) => item.opportunity_id === opportunity.id)
                      .sort((a, b) => {
                        const dateA = new Date(a.created_at || 0).getTime();

                        const dateB = new Date(b.created_at || 0).getTime();

                        return dateB - dateA;
                      });

                    const application =
                      opportunityApplications.find(
                        (item) =>
                          item.status !== STATUS.application.WITHDRAWN &&
                          item.status !== STATUS.application.REJECTED
                      ) || opportunityApplications[0];

                    const applicationAssignment = application
                      ? assignmentByApplicationId[application.id]
                      : null;

                    const capacity = getOpportunityCapacity(opportunity.id);

                    const availableSlots = capacity
                      ? Number(capacity.available_slots)
                      : null;

                    const occupiedSlots = capacity
                      ? Number(capacity.occupied_slots)
                      : null;

                    const isFull =
                      availableSlots !== null && availableSlots <= 0;

                    return (
                      <button
                        key={opportunity.id}
                        type="button"
                        onClick={() => handleSelectOpportunity(opportunity)}
                        className={`text-left border rounded-xl p-4 transition ${
                          opportunityId === opportunity.id
                            ? darkMode
                              ? "border-blue-500 ring-2 ring-blue-950"
                              : "border-blue-500 ring-2 ring-blue-100"
                            : darkMode
                            ? "border-slate-700 hover:border-slate-500"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex justify-between gap-2">
                          <strong>{opportunity.title}</strong>

                          <span
                            className={`text-[10px] font-bold ${
                              isFull ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {isFull ? "Full" : "Active"}
                          </span>
                        </div>

                        <p
                          className={`text-xs mt-1 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {company?.company_name || "Company"} ·{" "}
                          {opportunity.location}
                        </p>

                        <p
                          className={`text-xs mt-2 line-clamp-3 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {opportunity.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <span
                            className={`text-[10px] px-2 py-1 rounded-md ${
                              darkMode
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            📍 {opportunity.location}
                          </span>

                          <span
                            className={`text-[10px] px-2 py-1 rounded-md ${
                              darkMode
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            👥 {opportunity.openings}{" "}
                            {opportunity.openings === 1
                              ? "opening"
                              : "openings"}
                          </span>

                          {/* =====================================
                              AVAILABLE SLOTS
                          ===================================== */}

                          <span
                            className={`text-[10px] px-2 py-1 rounded-md font-bold ${
                              capacity
                                ? isFull
                                  ? darkMode
                                    ? "bg-red-950/50 text-red-300"
                                    : "bg-red-50 text-red-600"
                                  : darkMode
                                  ? "bg-emerald-950/50 text-emerald-300"
                                  : "bg-emerald-50 text-emerald-600"
                                : darkMode
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {capacity
                              ? isFull
                                ? "🚫 No slots available"
                                : `🟢 ${availableSlots} ${
                                    availableSlots === 1 ? "slot" : "slots"
                                  } available`
                              : "⏳ Checking slots..."}
                          </span>

                          <span
                            className={`text-[10px] px-2 py-1 rounded-md ${
                              darkMode
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            💼 {opportunity.position_type || "On-site"}
                          </span>
                        </div>

                        {/* =====================================
                            CAPACITY SUMMARY
                        ===================================== */}

                        {capacity && (
                          <div
                            className={`mt-3 rounded-lg border p-3 ${
                              darkMode
                                ? "border-slate-700 bg-slate-800/60"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                  Internship Slots
                                </p>

                                <p
                                  className={`text-xs font-semibold mt-1 ${
                                    isFull ? "text-red-600" : "text-emerald-600"
                                  }`}
                                >
                                  {isFull
                                    ? "No slots available"
                                    : `${availableSlots} ${
                                        availableSlots === 1 ? "slot" : "slots"
                                      } remaining`}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-[10px] text-slate-400">
                                  {occupiedSlots} / {capacity.total_openings}{" "}
                                  occupied
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 space-y-1">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Internship Start
                            </p>

                            <p
                              className={`text-xs font-semibold mt-1 ${
                                darkMode ? "text-slate-300" : "text-slate-600"
                              }`}
                            >
                              {formatDate(
                                opportunity.internship_start_date ||
                                  opportunity.internship_start
                              )}
                            </p>
                          </div>

                          <div className="pt-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Internship End
                            </p>

                            <p
                              className={`text-xs font-semibold mt-1 ${
                                darkMode ? "text-slate-300" : "text-slate-600"
                              }`}
                            >
                              {formatDate(
                                opportunity.internship_end_date ||
                                  opportunity.internship_end
                              )}
                            </p>
                          </div>
                        </div>

                        {opportunity.availability && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Availability: {opportunity.availability}
                          </p>
                        )}

                        {application && (
                          <div
                            className={`mt-3 text-[10px] font-bold ${
                              applicationAssignment?.status ===
                                STATUS.assignment.ACTIVE ||
                              applicationAssignment?.status ===
                                STATUS.assignment.COMPLETED
                                ? "text-emerald-600"
                                : applicationAssignment?.status ===
                                  STATUS.assignment.TERMINATED
                                ? "text-red-600"
                                : applicationAssignment?.status ===
                                  STATUS.assignment.PENDING
                                ? "text-blue-600"
                                : statusTone(application.status)
                            }`}
                          >
                            {applicationAssignment
                              ? `Placement: ${formatStatus(
                                  applicationAssignment.status
                                )}`
                              : `Application: ${formatStatus(
                                  application.status
                                )}`}
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* =================================================
                  SELECTED OPPORTUNITY
              ================================================= */}

              {selectedOpportunity && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Selected Opportunity
                    </label>

                    <input
                      className={`w-full border rounded-lg px-3 py-2 text-sm ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                          : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                      }`}
                      value={`${selectedOpportunity.title} — ${
                        selectedOpportunity.companies?.company_name || "Company"
                      }`}
                      readOnly
                    />
                  </div>

                  {/* =================================================
                      CLOSED OPPORTUNITY NOTICE
                  ================================================= */}

                  {!selectedOpportunityIsActive && existingApplication && (
                    <div
                      className={`border rounded-xl p-4 ${
                        darkMode
                          ? "border-slate-700 bg-slate-800/50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-500">
                        Opportunity Closed
                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        This opportunity is no longer accepting new
                        applications. Your existing application is still valid
                        and can continue through the review and placement
                        process.
                      </p>
                    </div>
                  )}

                  {/* =================================================
                      FULL OPPORTUNITY NOTICE
                  ================================================= */}

                  {selectedOpportunityIsActive &&
                    selectedOpportunityCapacity &&
                    Number(selectedOpportunityCapacity.available_slots) <=
                      0 && (
                      <div
                        className={`border rounded-xl p-4 ${
                          darkMode
                            ? "border-red-800 bg-red-950/30"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-lg">🚫</div>

                          <div>
                            <p className="text-xs font-bold text-red-600">
                              No Slots Available
                            </p>

                            <p
                              className={`text-xs mt-1 ${
                                darkMode ? "text-red-200" : "text-red-800"
                              }`}
                            >
                              This internship opportunity has reached its
                              maximum capacity. New applications cannot be
                              submitted while no slot is available.
                            </p>

                            <p
                              className={`text-[10px] mt-2 ${
                                darkMode ? "text-red-300" : "text-red-700"
                              }`}
                            >
                              Existing applications are not affected by the
                              opportunity reaching full capacity.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* =================================================
                      OPPORTUNITY DETAILS
                  ================================================= */}

                  <div
                    className={`grid sm:grid-cols-2 lg:grid-cols-5 gap-3 border rounded-xl p-4 ${
                      darkMode
                        ? "border-slate-700 bg-slate-800/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Location
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {selectedOpportunity.location}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Position Type
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {selectedOpportunity.position_type || "On-site"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Total Openings
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {selectedOpportunity.openings}{" "}
                        {selectedOpportunity.openings === 1
                          ? "opening"
                          : "openings"}
                      </p>
                    </div>

                    {/* =========================================
                        OCCUPIED SLOTS
                    ========================================= */}

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Occupied Slots
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {selectedOpportunityCapacity
                          ? selectedOpportunityCapacity.occupied_slots
                          : "Checking..."}
                      </p>
                    </div>

                    {/* =========================================
                        AVAILABLE SLOTS
                    ========================================= */}

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Available Slots
                      </p>

                      <p
                        className={`text-xs font-bold mt-1 ${
                          selectedOpportunityCapacity &&
                          Number(selectedOpportunityCapacity.available_slots) <=
                            0
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {selectedOpportunityCapacity
                          ? Number(
                              selectedOpportunityCapacity.available_slots
                            ) <= 0
                            ? "No slots available"
                            : `${selectedOpportunityCapacity.available_slots} ${
                                Number(
                                  selectedOpportunityCapacity.available_slots
                                ) === 1
                                  ? "slot"
                                  : "slots"
                              }`
                          : "Checking..."}
                      </p>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-5">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Internship Period
                      </p>

                      <p className="text-xs font-semibold mt-1">
                        {formatInternshipPeriod(selectedOpportunity)}
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      INFORMATION REQUESTED
                  ================================================= */}

                  {existingApplication?.status ===
                    STATUS.application.INFO_REQUESTED &&
                    !isReapplying && (
                      <div
                        className={`border rounded-xl p-4 ${
                          darkMode
                            ? "border-orange-800 bg-orange-950/30"
                            : "border-orange-200 bg-orange-50"
                        }`}
                      >
                        <p className="text-xs font-bold text-orange-600">
                          Additional Information Requested
                        </p>

                        <p
                          className={`text-xs mt-2 ${
                            darkMode ? "text-orange-200" : "text-orange-800"
                          }`}
                        >
                          The Registrar has requested changes or additional
                          information before your application can continue.
                        </p>

                        {existingApplication.notes && (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${
                              darkMode
                                ? "border-orange-800 bg-orange-950/40"
                                : "border-orange-200 bg-white"
                            }`}
                          >
                            <p className="text-[10px] uppercase font-bold text-orange-600">
                              Registrar's Message
                            </p>

                            <p className="text-xs mt-1">
                              {existingApplication.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* =================================================
                      REJECTED / WITHDRAWN
                  ================================================= */}

                  {[
                    STATUS.application.REJECTED,
                    STATUS.application.WITHDRAWN,
                  ].includes(existingApplication?.status) &&
                    !isReapplying && (
                      <div
                        className={`border rounded-xl p-4 ${
                          existingApplication.status ===
                          STATUS.application.REJECTED
                            ? darkMode
                              ? "border-red-800 bg-red-950/30"
                              : "border-red-200 bg-red-50"
                            : darkMode
                            ? "border-slate-700 bg-slate-800/50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={`text-xs font-bold ${
                                existingApplication.status ===
                                STATUS.application.REJECTED
                                  ? "text-red-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {existingApplication.status ===
                              STATUS.application.REJECTED
                                ? "Application Rejected"
                                : "Placement Declined"}
                            </p>

                            <p
                              className={`text-xs mt-2 ${
                                darkMode ? "text-slate-300" : "text-slate-600"
                              }`}
                            >
                              {existingApplication.status ===
                              STATUS.application.REJECTED
                                ? "Your application was not approved by the Registrar."
                                : "You declined this internship placement."}
                            </p>
                          </div>

                          <span
                            className={`text-xs font-bold ${
                              existingApplication.status ===
                              STATUS.application.REJECTED
                                ? "text-red-600"
                                : "text-slate-500"
                            }`}
                          >
                            {formatStatus(existingApplication.status)}
                          </span>
                        </div>

                        {existingApplication.notes && (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${
                              darkMode
                                ? "border-slate-700 bg-slate-900"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p
                              className={`text-[10px] uppercase font-bold ${
                                existingApplication.status ===
                                STATUS.application.REJECTED
                                  ? "text-red-600"
                                  : "text-slate-500"
                              }`}
                            >
                              {existingApplication.status ===
                              STATUS.application.REJECTED
                                ? "Reason for Rejection"
                                : "Note"}
                            </p>

                            <p className="text-xs mt-1">
                              {existingApplication.notes}
                            </p>
                          </div>
                        )}

                        {canApplyAgain(selectedOpportunity.id) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleApplyAgain(selectedOpportunity)
                            }
                            className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                          >
                            Apply Again
                          </button>
                        )}
                      </div>
                    )}

                  {/* =================================================
                      COMPLETED / TERMINATED PLACEMENT
                  ================================================= */}

                  {(() => {
                    const selectedAssignment = existingApplication
                      ? assignmentByApplicationId[existingApplication.id]
                      : null;

                    if (!selectedAssignment) {
                      return null;
                    }

                    const statusInfo =
                      getAssignmentStatusInfo(selectedAssignment);

                    const toneClasses = {
                      emerald: darkMode
                        ? "border-emerald-800 bg-emerald-950/30"
                        : "border-emerald-200 bg-emerald-50",

                      red: darkMode
                        ? "border-red-800 bg-red-950/30"
                        : "border-red-200 bg-red-50",

                      amber: darkMode
                        ? "border-amber-800 bg-amber-950/30"
                        : "border-amber-200 bg-amber-50",

                      blue: darkMode
                        ? "border-blue-800 bg-blue-950/30"
                        : "border-blue-200 bg-blue-50",
                    };

                    const textClasses = {
                      emerald: darkMode
                        ? "text-emerald-200"
                        : "text-emerald-800",

                      red: darkMode ? "text-red-200" : "text-red-800",

                      amber: darkMode ? "text-amber-200" : "text-amber-800",

                      blue: darkMode ? "text-blue-200" : "text-blue-800",
                    };

                    return (
                      <div
                        className={`border rounded-xl p-5 ${
                          toneClasses[statusInfo.tone]
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl">{statusInfo.icon}</div>

                          <div className="flex-1">
                            <p
                              className={`text-sm font-bold ${
                                statusInfo.tone === "emerald"
                                  ? "text-emerald-600"
                                  : statusInfo.tone === "red"
                                  ? "text-red-600"
                                  : statusInfo.tone === "amber"
                                  ? "text-amber-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {statusInfo.title}
                            </p>

                            <p
                              className={`text-xs mt-1 ${
                                textClasses[statusInfo.tone]
                              }`}
                            >
                              {statusInfo.description}
                            </p>

                            <div className="mt-3 grid sm:grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                  Assignment Status
                                </p>

                                <p className="text-xs font-semibold mt-1">
                                  {formatStatus(selectedAssignment.status)}
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                  Internship Period
                                </p>

                                <p className="text-xs font-semibold mt-1">
                                  {formatDate(selectedAssignment.start_date)} –{" "}
                                  {formatDate(selectedAssignment.end_date)}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleViewStatusPage}
                              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                            >
                              View Full Status →
                            </button>

                            {selectedAssignment.status ===
                              STATUS.assignment.TERMINATED &&
                              canApplyAgain(
                                selectedAssignment.opportunity_id
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApplyAgain(selectedOpportunity)
                                  }
                                  className="mt-2 ml-2 px-4 py-2 rounded-lg border text-xs font-bold"
                                >
                                  Apply Again
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* =================================================
                      ACTIVE APPLICATION
                  ================================================= */}

                  {existingApplication &&
                    ![
                      STATUS.application.DRAFT,
                      STATUS.application.INFO_REQUESTED,
                      STATUS.application.REJECTED,
                      STATUS.application.APPROVED,
                      STATUS.application.ACCEPTED,
                      STATUS.application.WITHDRAWN,
                    ].includes(existingApplication.status) && (
                      <div
                        className={`border rounded-xl p-4 ${
                          darkMode
                            ? "border-slate-700 bg-slate-800"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="text-xs font-bold">
                          You already have an active application for this
                          opportunity.
                        </p>

                        <p
                          className={`text-xs mt-1 ${statusTone(
                            existingApplication.status
                          )}`}
                        >
                          Status: {formatStatus(existingApplication.status)}
                        </p>
                      </div>
                    )}

                  {/* =================================================
                      EDITABLE FORM
                  ================================================= */}

                  {!hasActiveAssignment &&
                    !hasPlacementOffer &&
                    (!existingApplication ||
                      existingApplication.status === STATUS.application.DRAFT ||
                      existingApplication.status ===
                        STATUS.application.INFO_REQUESTED ||
                      isReapplying) && (
                      <>
                        {!hasResume && (
                          <div
                            className={`border rounded-lg p-3 ${
                              darkMode
                                ? "border-amber-800 bg-amber-950/30"
                                : "border-amber-200 bg-amber-50"
                            }`}
                          >
                            <p className="text-xs font-bold text-amber-600">
                              Resume/CV Required
                            </p>

                            <p
                              className={`text-[10px] mt-1 ${
                                darkMode ? "text-amber-200" : "text-amber-800"
                              }`}
                            >
                              Please upload your Resume/CV in your Student
                              Profile before submitting an internship
                              application.
                            </p>

                            <button
                              type="button"
                              onClick={() => navigate("/student/profile")}
                              className="mt-3 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-700"
                            >
                              Go to Profile →
                            </button>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            {isReapplying
                              ? "New Application Cover Letter"
                              : existingApplication?.status ===
                                STATUS.application.INFO_REQUESTED
                              ? "Update Cover Letter"
                              : "Cover Letter"}
                          </label>

                          <textarea
                            rows="5"
                            className={`w-full border rounded-lg px-3 py-2 text-sm ${
                              darkMode
                                ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                                : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400"
                            }`}
                            value={coverLetter}
                            onChange={(event) =>
                              setCoverLetter(event.target.value)
                            }
                            placeholder="Explain your interest in this opportunity."
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* =========================================
                            FULL OPPORTUNITY WARNING
                        ========================================= */}

                        {selectedOpportunityIsActive &&
                          selectedOpportunityCapacity &&
                          Number(selectedOpportunityCapacity.available_slots) <=
                            0 &&
                          (!existingApplication ||
                            isReapplying ||
                            existingApplication.status ===
                              STATUS.application.REJECTED ||
                            existingApplication.status ===
                              STATUS.application.WITHDRAWN) && (
                            <div
                              className={`border rounded-lg p-3 ${
                                darkMode
                                  ? "border-red-800 bg-red-950/30"
                                  : "border-red-200 bg-red-50"
                              }`}
                            >
                              <p className="text-xs font-bold text-red-600">
                                🚫 No slots available
                              </p>

                              <p
                                className={`text-[10px] mt-1 ${
                                  darkMode ? "text-red-200" : "text-red-800"
                                }`}
                              >
                                This opportunity is currently full. New
                                applications cannot be submitted until a slot
                                becomes available.
                              </p>
                            </div>
                          )}

                        <div className="flex flex-wrap gap-2">
                          {!isReapplying &&
                            existingApplication?.status !==
                              STATUS.application.INFO_REQUESTED && (
                              <button
                                type="button"
                                className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                                  isSubmitting ||
                                  (selectedOpportunityIsActive &&
                                    selectedOpportunityCapacity &&
                                    Number(
                                      selectedOpportunityCapacity.available_slots
                                    ) <= 0)
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                onClick={handleSaveDraft}
                                disabled={
                                  isSubmitting ||
                                  (selectedOpportunityIsActive &&
                                    selectedOpportunityCapacity &&
                                    Number(
                                      selectedOpportunityCapacity.available_slots
                                    ) <= 0)
                                }
                              >
                                {isSubmitting ? "Saving..." : "Save Draft"}
                              </button>
                            )}

                          {existingApplication?.status ===
                            STATUS.application.INFO_REQUESTED &&
                          !isReapplying ? (
                            <button
                              type="button"
                              className={`px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold ${
                                isSubmitting
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-blue-700"
                              }`}
                              onClick={handleResubmitInformation}
                              disabled={isSubmitting}
                            >
                              {isSubmitting
                                ? "Resubmitting..."
                                : "Resubmit Application"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold ${
                                isSubmitting ||
                                (selectedOpportunityIsActive &&
                                  selectedOpportunityCapacity &&
                                  Number(
                                    selectedOpportunityCapacity.available_slots
                                  ) <= 0)
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-slate-800"
                              }`}
                              onClick={handleSubmitApplication}
                              disabled={
                                isSubmitting ||
                                (selectedOpportunityIsActive &&
                                  selectedOpportunityCapacity &&
                                  Number(
                                    selectedOpportunityCapacity.available_slots
                                  ) <= 0)
                              }
                            >
                              {isSubmitting
                                ? "Submitting..."
                                : isReapplying
                                ? "Submit New Application"
                                : "Submit Application"}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        /* =====================================================
           STATUS TAB
        ===================================================== */

        <section
          className={`border rounded-2xl p-5 md:p-6 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Application Status</h2>

              <p className="text-xs text-slate-500 mt-1">
                Track your internship applications and placement progress.
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              {applications.length} application
              {applications.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* =================================================
              PLACEMENT OFFER
          ================================================= */}

          {hasPlacementOffer && approvedApplication && (
            <div
              className={`mb-5 border-2 rounded-2xl p-5 ${
                darkMode
                  ? "border-blue-700 bg-blue-950/30"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎉</div>

                <div className="flex-1">
                  <p className="text-sm font-black text-blue-600">
                    Internship Placement Offered
                  </p>

                  <p
                    className={`text-xs mt-1 ${
                      darkMode ? "text-blue-200" : "text-blue-800"
                    }`}
                  >
                    The Registrar has approved one of your internship
                    applications. Please confirm whether you want to accept this
                    placement.
                  </p>

                  {(() => {
                    const opportunity = opportunities.find(
                      (item) => item.id === approvedApplication.opportunity_id
                    );

                    if (!opportunity) {
                      return (
                        <div className="mt-4 text-xs text-red-600">
                          The approved internship opportunity could not be
                          loaded.
                        </div>
                      );
                    }

                    return (
                      <div
                        className={`mt-4 rounded-xl border p-4 ${
                          darkMode
                            ? "border-blue-800 bg-slate-900"
                            : "border-blue-200 bg-white"
                        }`}
                      >
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-bold text-sm">
                              {opportunity.title}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {opportunity.companies?.company_name || "Company"}
                            </p>
                          </div>

                          {opportunity.status === STATUS.opportunity.CLOSED && (
                            <span className="text-[10px] font-bold text-slate-500">
                              Closed
                            </span>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 mt-3">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Location
                            </p>

                            <p className="text-xs font-semibold mt-1">
                              {opportunity.location || "Not specified"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Position Type
                            </p>

                            <p className="text-xs font-semibold mt-1">
                              {opportunity.position_type || "On-site"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Internship Period
                            </p>

                            <p className="text-xs font-semibold mt-1">
                              {formatInternshipPeriod(opportunity)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Application Status
                            </p>

                            <p className="text-xs font-bold text-blue-600 mt-1">
                              Approved — Awaiting Confirmation
                            </p>
                          </div>
                        </div>

                        <div
                          className={`mt-4 pt-4 border-t ${
                            darkMode ? "border-slate-700" : "border-slate-200"
                          }`}
                        >
                          <p
                            className={`text-xs ${
                              darkMode ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            <strong>Important:</strong> Confirming this
                            placement will create your internship assignment and
                            withdraw your other active applications.
                          </p>

                          <div className="flex flex-wrap gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleConfirmPlacement(approvedApplication)
                              }
                              disabled={isConfirmingPlacement}
                              className={`px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold ${
                                isConfirmingPlacement
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-emerald-700"
                              }`}
                            >
                              {isConfirmingPlacement
                                ? "Confirming..."
                                : "✓ Confirm Placement"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeclinePlacement(approvedApplication)
                              }
                              disabled={isConfirmingPlacement}
                              className={`px-5 py-2.5 rounded-lg border text-xs font-bold ${
                                isConfirmingPlacement
                                  ? "opacity-50 cursor-not-allowed"
                                  : darkMode
                                  ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              Decline Placement
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              CURRENT ASSIGNMENT
          ================================================= */}

          {latestAssignment && (
            <div
              className={`mb-5 border rounded-2xl p-5 ${
                latestAssignment.status === STATUS.assignment.ACTIVE ||
                latestAssignment.status === STATUS.assignment.COMPLETED
                  ? darkMode
                    ? "border-emerald-800 bg-emerald-950/30"
                    : "border-emerald-200 bg-emerald-50"
                  : latestAssignment.status === STATUS.assignment.TERMINATED
                  ? darkMode
                    ? "border-red-800 bg-red-950/30"
                    : "border-red-200 bg-red-50"
                  : latestAssignment.status === STATUS.assignment.SUSPENDED
                  ? darkMode
                    ? "border-amber-800 bg-amber-950/30"
                    : "border-amber-200 bg-amber-50"
                  : darkMode
                  ? "border-blue-800 bg-blue-950/30"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              {(() => {
                const statusInfo = getAssignmentStatusInfo(latestAssignment);

                const opportunity = opportunities.find(
                  (item) => item.id === latestAssignment.opportunity_id
                );

                const company = opportunity?.companies;

                return (
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{statusInfo?.icon || "ℹ️"}</div>

                    <div className="flex-1">
                      <p
                        className={`text-sm font-black ${
                          latestAssignment.status ===
                            STATUS.assignment.ACTIVE ||
                          latestAssignment.status ===
                            STATUS.assignment.COMPLETED
                            ? "text-emerald-600"
                            : latestAssignment.status ===
                              STATUS.assignment.TERMINATED
                            ? "text-red-600"
                            : latestAssignment.status ===
                              STATUS.assignment.SUSPENDED
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      >
                        {statusInfo?.title}
                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {statusInfo?.description}
                      </p>

                      {opportunity && (
                        <div
                          className={`mt-4 rounded-xl border p-4 ${
                            darkMode
                              ? "border-slate-700 bg-slate-900"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex justify-between gap-3">
                            <div>
                              <p className="font-bold text-sm">
                                {opportunity.title}
                              </p>

                              <p className="text-xs text-slate-500 mt-1">
                                {company?.company_name || "Company"}
                              </p>
                            </div>

                            {opportunity.status ===
                              STATUS.opportunity.CLOSED && (
                              <span className="text-[10px] font-bold text-slate-500">
                                Closed
                              </span>
                            )}
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3 mt-3">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Location
                              </p>

                              <p className="text-xs font-semibold mt-1">
                                {opportunity.location || "Not specified"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Position Type
                              </p>

                              <p className="text-xs font-semibold mt-1">
                                {opportunity.position_type || "On-site"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Start Date
                              </p>

                              <p className="text-xs font-semibold mt-1">
                                {formatDate(latestAssignment.start_date)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                End Date
                              </p>

                              <p className="text-xs font-semibold mt-1">
                                {formatDate(latestAssignment.end_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          type="button"
                          onClick={handleViewStatusPage}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                        >
                          View Full Internship Status →
                        </button>

                        {latestAssignment.status ===
                          STATUS.assignment.TERMINATED &&
                          canApplyAgain(latestAssignment.opportunity_id) && (
                            <button
                              type="button"
                              onClick={() =>
                                opportunity && handleApplyAgain(opportunity)
                              }
                              className={`px-4 py-2 rounded-lg border text-xs font-bold ${
                                darkMode
                                  ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              Apply Again
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* =================================================
              APPLICATION LIST
          ================================================= */}

          {applications.length === 0 ? (
            <div
              className={`border rounded-xl p-8 text-center ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="text-3xl mb-3">📋</div>

              <p className="text-sm font-semibold">No applications yet.</p>

              <p className="text-xs text-slate-500 mt-1">
                Your submitted applications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => {
                const opportunity = opportunities.find(
                  (item) => item.id === application.opportunity_id
                );

                const applicationAssignment =
                  assignmentByApplicationId[application.id];

                const isPlacementOffer =
                  application.status === STATUS.application.APPROVED &&
                  !applicationAssignment;

                const isAccepted =
                  application.status === STATUS.application.ACCEPTED;

                const isConfirmedApplication = Boolean(applicationAssignment);

                const isCompleted =
                  applicationAssignment?.status === STATUS.assignment.COMPLETED;

                const isTerminated =
                  applicationAssignment?.status ===
                  STATUS.assignment.TERMINATED;

                const isActive =
                  applicationAssignment?.status === STATUS.assignment.ACTIVE;

                const isOpportunityClosed =
                  opportunity?.status === STATUS.opportunity.CLOSED;

                return (
                  <div
                    key={application.id}
                    className={`border rounded-xl p-4 ${
                      isPlacementOffer
                        ? darkMode
                          ? "border-blue-700 bg-blue-950/20"
                          : "border-blue-200 bg-blue-50/40"
                        : isCompleted ||
                          isActive ||
                          isAccepted ||
                          isConfirmedApplication
                        ? darkMode
                          ? "border-emerald-700 bg-emerald-950/20"
                          : "border-emerald-200 bg-emerald-50/40"
                        : isTerminated
                        ? darkMode
                          ? "border-red-700 bg-red-950/20"
                          : "border-red-200 bg-red-50/40"
                        : darkMode
                        ? "border-slate-700"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {opportunity?.title || application.opportunity_id}
                          </p>

                          {isOpportunityClosed && (
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold">
                              Closed
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500">
                          {opportunity?.companies?.company_name || "Company"}
                        </p>

                        {opportunity && (
                          <p className="text-xs text-slate-500 mt-1">
                            📅 {formatInternshipPeriod(opportunity)}
                          </p>
                        )}

                        <p className="text-[10px] text-slate-400 mt-1">
                          Application ID: {application.id}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-bold ${
                          applicationAssignment?.status ===
                            STATUS.assignment.ACTIVE ||
                          applicationAssignment?.status ===
                            STATUS.assignment.COMPLETED
                            ? "text-emerald-600"
                            : applicationAssignment?.status ===
                              STATUS.assignment.TERMINATED
                            ? "text-red-600"
                            : applicationAssignment?.status ===
                              STATUS.assignment.SUSPENDED
                            ? "text-amber-600"
                            : applicationAssignment?.status ===
                              STATUS.assignment.PENDING
                            ? "text-blue-600"
                            : statusTone(application.status)
                        }`}
                      >
                        {applicationAssignment
                          ? formatStatus(applicationAssignment.status)
                          : formatStatus(application.status)}
                      </span>
                    </div>

                    {isOpportunityClosed && (
                      <p className="text-[10px] text-slate-500 mt-2">
                        This opportunity is closed to new applicants. Your
                        existing application remains active in the internship
                        process.
                      </p>
                    )}

                    {application.submitted_at && (
                      <p className="text-xs text-slate-500 mt-2">
                        Submitted:{" "}
                        {new Date(application.submitted_at).toLocaleString()}
                      </p>
                    )}

                    {/* =========================================
                            APPROVED — WAITING FOR CONFIRMATION
                      ========================================= */}

                    {isPlacementOffer && (
                      <div
                        className={`mt-3 p-3 rounded-lg border ${
                          darkMode
                            ? "border-blue-800 bg-blue-950/40"
                            : "border-blue-200 bg-blue-50"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold text-blue-600">
                          Placement Confirmation Required
                        </p>

                        <p
                          className={`text-xs mt-1 ${
                            darkMode ? "text-blue-200" : "text-blue-800"
                          }`}
                        >
                          The Registrar approved this application. Confirm it to
                          create your internship assignment.
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => handleConfirmPlacement(application)}
                            disabled={isConfirmingPlacement}
                            className={`px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold ${
                              isConfirmingPlacement
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-emerald-700"
                            }`}
                          >
                            {isConfirmingPlacement
                              ? "Confirming..."
                              : "✓ Confirm Placement"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeclinePlacement(application)}
                            disabled={isConfirmingPlacement}
                            className={`px-4 py-2 rounded-lg border text-xs font-bold ${
                              isConfirmingPlacement
                                ? "opacity-50 cursor-not-allowed"
                                : darkMode
                                ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                                : "border-slate-300 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Decline Placement
                          </button>
                        </div>
                      </div>
                    )}

                    {/* =========================================
                            CONFIRMED / ACTIVE / COMPLETED
                      ========================================= */}

                    {applicationAssignment && !isTerminated && (
                      <div
                        className={`mt-3 p-3 rounded-lg border ${
                          darkMode
                            ? "border-emerald-800 bg-emerald-950/30"
                            : "border-emerald-200 bg-emerald-50"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold text-emerald-600">
                          {isCompleted
                            ? "Internship Completed"
                            : isActive
                            ? "Internship Active"
                            : applicationAssignment.status ===
                              STATUS.assignment.PENDING
                            ? applicationAssignment.deployed_at
                              ? "Waiting for Company Decision"
                              : "Internship Placement Confirmed"
                            : "Internship Placement"}
                        </p>

                        <p
                          className={`text-xs mt-1 ${
                            darkMode ? "text-emerald-200" : "text-emerald-800"
                          }`}
                        >
                          {isCompleted
                            ? "Your internship placement has been completed successfully."
                            : isActive
                            ? "The company accepted your placement. Your internship is now active."
                            : applicationAssignment.deployed_at
                            ? "Your internship has been deployed to the company and is awaiting their decision."
                            : "You confirmed this internship placement. Your assignment has been created."}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={handleViewStatusPage}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                          >
                            View Status →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* =========================================
                            TERMINATED
                      ========================================= */}

                    {isTerminated && (
                      <div
                        className={`mt-3 p-3 rounded-lg border ${
                          darkMode
                            ? "border-red-800 bg-red-950/30"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold text-red-600">
                          Placement Terminated
                        </p>

                        <p
                          className={`text-xs mt-1 ${
                            darkMode ? "text-red-200" : "text-red-800"
                          }`}
                        >
                          This internship placement has been terminated.
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={handleViewStatusPage}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                          >
                            View Status →
                          </button>

                          {opportunity &&
                            canApplyAgain(application.opportunity_id) && (
                              <button
                                type="button"
                                onClick={() => handleApplyAgain(opportunity)}
                                className={`px-4 py-2 rounded-lg border text-xs font-bold ${
                                  darkMode
                                    ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                Apply Again
                              </button>
                            )}
                        </div>
                      </div>
                    )}

                    {/* =========================================
                            INFORMATION REQUESTED
                      ========================================= */}

                    {application.status ===
                      STATUS.application.INFO_REQUESTED && (
                      <div
                        className={`mt-3 p-3 rounded-lg border ${
                          darkMode
                            ? "border-orange-800 bg-orange-950/30"
                            : "border-orange-200 bg-orange-50"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold text-orange-600">
                          Action Required
                        </p>

                        <p className="text-xs mt-1">
                          {application.notes ||
                            "The Registrar requested additional information."}
                        </p>

                        {opportunity && (
                          <button
                            type="button"
                            onClick={() => handleSelectOpportunity(opportunity)}
                            className="mt-2 text-xs font-bold text-orange-600 hover:underline"
                          >
                            Update & Resubmit →
                          </button>
                        )}
                      </div>
                    )}

                    {/* =========================================
                            REJECTION
                      ========================================= */}

                    {application.status === STATUS.application.REJECTED &&
                      (() => {
                        const rejectionInfo = getRejectionInfo(application);

                        return (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${
                              darkMode
                                ? "border-red-800 bg-red-950/30"
                                : "border-red-200 bg-red-50"
                            }`}
                          >
                            <p className="text-[10px] uppercase font-bold text-red-600">
                              Rejected by {rejectionInfo.source}
                            </p>

                            <p
                              className={`text-xs mt-2 ${
                                darkMode ? "text-red-200" : "text-red-800"
                              }`}
                            >
                              {rejectionInfo.reason}
                            </p>

                            {opportunity &&
                              canApplyAgain(application.opportunity_id) && (
                                <button
                                  type="button"
                                  onClick={() => handleApplyAgain(opportunity)}
                                  className="mt-3 text-xs font-bold text-red-600 hover:underline"
                                >
                                  Apply Again →
                                </button>
                              )}
                          </div>
                        );
                      })()}

                    {/* =========================================
                            WITHDRAWN
                      ========================================= */}

                    {application.status === STATUS.application.WITHDRAWN && (
                      <div
                        className={`mt-3 p-3 rounded-lg border ${
                          darkMode
                            ? "border-slate-700 bg-slate-800/50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          Placement Declined
                        </p>

                        <p className="text-xs mt-1 text-slate-500">
                          {application.notes ||
                            "You declined this internship placement."}
                        </p>

                        {opportunity &&
                          canApplyAgain(application.opportunity_id) && (
                            <button
                              type="button"
                              onClick={() => handleApplyAgain(opportunity)}
                              className={`mt-3 px-4 py-2 rounded-lg border text-xs font-bold ${
                                darkMode
                                  ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              Apply Again
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
