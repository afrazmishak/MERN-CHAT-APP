import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function LoginPage() {
    const navigate = useNavigate();
    const { user, login } = useState({
        identifier: "",
        password: "",
    });

    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/" replace />
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSubmitting(true);

        try {
            await login(FormData);
            navigate("/");
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to log in"
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1>Welcome back</h1>
                <p className="muted-text">
                    Log in using your email address or username.
                </p>

                {error }
            </section>
        </main>
    )
}