class ModelValidator {
    constructor(models) {
        this.models = models;
    }

    async validate(modelName, data) {
        const Model = this.models[modelName];
        if (!Model) {
            return { success: false, errors: [{ field: "general", message: "Invalid model name" }] };
        }
        try {
            const instance = new Model(data);
            await instance.validate();
            return { success: true, errors: null };
        } catch (err) {
            if (err.name === "ValidationError") {
                const errors = Object.keys(err.errors).map((key) => ({
                    field: key,
                    message: err.errors[key].message,
                }));
                return { success: false, errors };
            }
            return { success: false, errors: [{ field: "general", message: err.message }] };
        }
    }
}

// Usage example:
/*
const models = { PartyLedger, AnotherSchema }; // Add all your schemas here
const validator = new ModelValidator(models);

(async () => {
    const result = await validator.validate("PartyLedger", {
        partyName: "", // Invalid empty field
        partyLocation: "New York"
    });
    console.log(result);
})();
*/

module.exports = ModelValidator;
