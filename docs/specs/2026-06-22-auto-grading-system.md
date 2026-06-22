# Specification: Automated P4P Grading & Calibration System

This document describes the design and specification of the Automated P4P (Pound-for-Pound) Grading and Calibration system. It is designed to evaluate, rank, and calibrate the combat potential of creatures in the BioForce Atlas database using objective, scale-independent biological metrics.

---

## 1. Core Principles & Philosophy

Traditional rankings favor large apex predators (e.g., sharks, tigers) because of their absolute size and dominance. The P4P system aims to eliminate absolute size bias by evaluating creatures **as if they were scaled to the same weight/size**.

### The Mantis Shrimp vs. Great White Shark Example
* **Absolute scale**: A Great White Shark easily devours a Mantis Shrimp.
* **Pound-for-Pound (P4P) scale**: 
  * The Mantis Shrimp has a punch acceleration of $10,400\ g$, striking with the force of a $.22$ caliber bullet. Its compound eyes have 16 color receptive cones (humans have 3).
  * The Great White Shark relies heavily on mass and cartilaginous jaws. If scaled down to the size of a shrimp, its cartilaginous skeleton would collapse, and its bite force would be negligible.
  * **Result**: P4P, the Mantis Shrimp is vastly superior to the Shark in relative structural strength, impact acceleration, and sensory resolution.

---

## 2. Objective Grading Criteria (P4P)

Creatures are graded on a scale of **1 to 100** across five primary criteria:

1. **Relative Muscle Density & Exoskeletal Durability (RMD)**:
   * Exoskeleton shell hardness (Vickers hardness/mineralization).
   * Muscle force-to-mass ratio (e.g., leafcutter ants carrying 50x their weight).
2. **Impact Acceleration & Weaponry Efficiency (IAW)**:
   * Strike velocity and acceleration relative to body length.
   * Chemical potency (venom toxicity measured by $LD_{50}$ in mg/kg).
3. **Maneuverability & Reflex Latency (MRL)**:
   * Reflex response time (in milliseconds).
   * Locomotion speed relative to body length per second ($BL/s$).
4. **Metabolic Efficiency & Genetic Adaptations (MEG)**:
   * Anaerobic threshold and recovery rate.
   * Genetic resilience (extreme environment survival, self-regeneration).
5. **Sensory Resolution & Neural Processing (SRN)**:
   * Visual/auditory/olfactory receptors and processing speed.
   * Hunt success rate/tactical adaptability.

---

## 3. Comparative Grading Algorithm (5-Way Battles)

To calibrate ratings, the system runs comparative evaluations on **5 creatures at a time**.

### Evaluation Selection Logic:
* Prioritize selecting creatures with the lowest `grading_count` to ensure equal data quality.
* The system evaluates these 5 creatures together, comparing their characteristics, strengths, and weaknesses under scaled-down P4P rules.
* Points (1-100) are assigned dynamically by the AI grading engine for each criteria.
* Total P4P Score is calculated as:
  $$\text{Total P4P Score} = \frac{\text{RMD} + \text{IAW} + \text{MRL} + \text{MEG} + \text{SRN}}{5}$$
* The system increments `grading_count` by 1 for all 5 creatures.
* The system saves the grading results in a new database table `grading_history` for audit and logging.

---

## 4. Calibrating Overrated & Underrated Entities

The system compares the objective **AI P4P Score** with the subjective **Community P4P Score** (averaged from the `votes` table).

* **Calibration Delta**: 
  $$\Delta = \text{AI P4P Score} - \text{Community P4P Score}$$
* **Calibration Categories**:
  * **Underrated ($\Delta \ge 15$)**: The creature is biologically much more powerful than the community perceives it to be (e.g., Mantis Shrimp, Bullet Ant).
  * **Overrated ($\Delta \le -15$)**: The community overestimates the creature based on its absolute size, but it is weak P4P (e.g., Great White Shark, Lion).
  * **Accurate ($-15 < \Delta < 15$)**: Community perception matches scientific evaluation.

---

## 5. Schema Modifications (Supabase)

To track grading stats, we add columns to the `creatures` table and create a new logging table.

### 5.1. `creatures` table updates:
```sql
ALTER TABLE creatures 
ADD COLUMN grading_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN ai_p4p_score INTEGER DEFAULT 50 NOT NULL,
ADD COLUMN ai_tier TEXT DEFAULT 'C' NOT NULL;
```

### 5.2. `grading_history` table creation:
```sql
CREATE TABLE grading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creatures_evaluated TEXT[] NOT NULL, -- Array of 5 creature IDs
  evaluation_details JSONB NOT NULL, -- Details of the scores assigned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

---

## 6. Verification & Implementation Plan

1. **Database Migration**: Run SQL commands in Supabase.
2. **Backend API**:
   * Create `/api/admin/grade` to select 5 creatures with the lowest `grading_count`, run the AI P4P evaluation, record scores, increment counts, and save logs.
3. **Frontend Dashboard**:
   * Add a calibration panel in `/admin` displaying:
     * Current Leaderboard (sorted by `ai_p4p_score`).
     * Overrated and Underrated highlights.
     * Nút "Kích hoạt Chấm điểm Tự động" (Trigger Auto Grading).
