"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { Proposal, ProposalStatus } from "@/lib/types";
import Loading from "./loading";

const statusConfig: Record<
  ProposalStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  under_review: { label: "Under Review", variant: "default" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  revision_required: { label: "Revision Required", variant: "destructive" },
};

export default function ReviewPage() {
  const { user } = useAuth();
  const { proposals, updateProposalStatus, addAuditLog } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState<
    "approve" | "reject" | "revision_required" | null
  >(null);

  if (!user) return null;

  // Get proposals this faculty is advising
  const myProposals = proposals.filter((p) => p.facultyAdvisor === user.id);

  const pendingProposals = myProposals.filter(
    (p) => p.status === "submitted" || p.status === "under_review"
  );
  const reviewedProposals = myProposals.filter(
    (p) =>
      p.status === "approved" ||
      p.status === "rejected" ||
      p.status === "revision_required"
  );

  const filteredPending = pendingProposals.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.submittedByName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviewed = reviewedProposals.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.submittedByName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReview = () => {
    if (!selectedProposal || !reviewAction) return;

    const newStatus: ProposalStatus =
      reviewAction === "approve"
        ? "approved"
        : reviewAction === "reject"
        ? "rejected"
        : "revision_required";

    updateProposalStatus(selectedProposal.id, newStatus, {
      id: `review-${Date.now()}`,
      proposalId: selectedProposal.id,
      reviewerId: user.id,
      reviewerName: user.name,
      comment: reviewComment,
      decision: reviewAction,
      createdAt: new Date().toISOString(),
    });

    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: `PROPOSAL_${reviewAction.toUpperCase()}`,
      details: `${
        reviewAction === "approve"
          ? "Approved"
          : reviewAction === "reject"
          ? "Rejected"
          : "Requested revision for"
      } proposal: ${selectedProposal.title}`,
    });

    setSelectedProposal(null);
    setReviewComment("");
    setReviewAction(null);
  };

  const ProposalCard = ({
    proposal,
    showActions = false,
  }: {
    proposal: Proposal;
    showActions?: boolean;
  }) => {
    const config = statusConfig[proposal.status];

    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{proposal.title}</CardTitle>
              <CardDescription>
                By {proposal.submittedByName} | {proposal.department}
              </CardDescription>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {proposal.abstract}
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-muted-foreground">Budget:</span>{" "}
              <span className="font-medium">
                ${proposal.budget.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Timeline:</span>{" "}
              <span className="font-medium">{proposal.timeline}</span>
            </div>
          </div>

          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedProposal(proposal);
                  setReviewAction("approve");
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setSelectedProposal(proposal);
                  setReviewAction("revision_required");
                }}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Revise
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedProposal(proposal);
                  setReviewAction("reject");
                }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {!showActions && proposal.reviewComments && proposal.reviewComments.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Latest Review
              </p>
              <p className="text-sm">
                {proposal.reviewComments[proposal.reviewComments.length - 1].comment}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Review Proposals</h2>
          <p className="text-muted-foreground">
            Review and provide feedback on research proposals
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingProposals.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Reviewed ({reviewedProposals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {filteredPending.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-accent/40 mb-3" />
                  <p className="text-muted-foreground">
                    No proposals pending review
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPending.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    showActions
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="mt-6">
            {filteredReviewed.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No reviewed proposals</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredReviewed.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog
          open={!!selectedProposal && !!reviewAction}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProposal(null);
              setReviewAction(null);
              setReviewComment("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === "approve"
                  ? "Approve Proposal"
                  : reviewAction === "reject"
                  ? "Reject Proposal"
                  : "Request Revision"}
              </DialogTitle>
              <DialogDescription>
                {reviewAction === "approve"
                  ? "Confirm approval of this proposal"
                  : reviewAction === "reject"
                  ? "Please provide a reason for rejection"
                  : "Specify what changes are needed"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium text-sm">{selectedProposal?.title}</p>
                <p className="text-xs text-muted-foreground">
                  By {selectedProposal?.submittedByName}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">
                  {reviewAction === "approve" ? "Comments (optional)" : "Comments"}
                </Label>
                <Textarea
                  id="comment"
                  placeholder={
                    reviewAction === "approve"
                      ? "Add any comments for the researcher..."
                      : reviewAction === "reject"
                      ? "Explain why this proposal is being rejected..."
                      : "Describe what changes are needed..."
                  }
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProposal(null);
                    setReviewAction(null);
                    setReviewComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant={reviewAction === "reject" ? "destructive" : "default"}
                  onClick={handleReview}
                  disabled={
                    (reviewAction !== "approve" && !reviewComment.trim())
                  }
                >
                  {reviewAction === "approve"
                    ? "Approve Proposal"
                    : reviewAction === "reject"
                    ? "Reject Proposal"
                    : "Request Revision"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
