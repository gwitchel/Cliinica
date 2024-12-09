const { ipcRenderer } = window.require("electron");

const GetMyToDo = async (user) => {
    const patientData = await ipcRenderer.invoke("load-active-patient-flows"); // Request all JSON data
    const patients = await window.electron.loadCsv('patients');

    const personInvolvedId = user._id;
    console.log("personInvolvedId", personInvolvedId);

    const patientsNeedingAttention = [];

    for (const mrn in patientData) {
        const flows = patientData[mrn];

        for (const flow of flows) {
            const steps = flow.data.flows;

            let allStepsCompleted = true;
            let nextSteps = [];

            for (const sequence of steps) {
                for (const step of sequence) {
                    if (!step.isCompleted) {
                        allStepsCompleted = false;

                        if (step.peopleInvolved.includes(personInvolvedId)) {
                            // Ensure all previous steps are completed
                            let prevStepsCompleted = true;
                            const stepIndex = steps.indexOf(sequence);

                            for (let i = 0; i < stepIndex; i++) {
                                for (const prevStep of steps[i]) {
                                    if (!prevStep.isCompleted) {
                                        prevStepsCompleted = false;
                                        break;
                                    }
                                }
                                if (!prevStepsCompleted) break;
                            }

                            if (prevStepsCompleted) {
                                nextSteps.push(step);
                            }
                        }
                    }
                }
            }

            // Only consider the flow if not all steps are completed
            if (!allStepsCompleted && nextSteps.length > 0) {
                patientsNeedingAttention.push({ mrn, nextSteps });
            }
        }
    }

    // Get patient info from MRN
    const patientInfo = patients.filter(patient =>
        patientsNeedingAttention.some(p => p.mrn === patient['MRN'])
    );

    // Map next steps to patient info
    const patientInfoWithNextSteps = patientInfo.map(patient => {
        const flowData = patientsNeedingAttention.find(p => p.mrn === patient['MRN']);
        return {
            ...patient,
            next_steps: flowData ? flowData.nextSteps.map(step => step.title) : []
        };
    });

    return patientInfoWithNextSteps;
};

module.exports = { GetMyToDo };
