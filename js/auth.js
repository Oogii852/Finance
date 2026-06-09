import { supabase } from "./supabase.js";

const authForm = document.getElementById('auth-form')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const btnRegister = document.getElementById('btn-register')
const messageDiv = document.getElementById('message')

btnRegister.addEventListener('click', async () => {
    const email = emailInput.value
    const password = passwordInput.value

    if (!email || !password) {
        showMessage("email bolon nuuts ugee guitsed oruulna uu!", "text-danger")
        return
    }
    if (password.length < 6) {
        showMessage("nuuts ug dood tal ni 6 temdegt baih ystoi!", "text-danger")
        return
    }

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    })

    if (error) {
        showMessage(`bvrtgel amjiltgui : ${error.message}`, "text-danger")
    } else {
        showMessage("bvrtgel amjilttai! ta nevtreh tovchiig darj orno uu.", "text-success")
        passwordInput.value = ""
    }
})

authForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = emailInput.value
    const password = passwordInput.value

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    })

    if (error) {
        showMessage(`nevtreh amjiltgui : ${error.message}`, "text-danger")
    } else {
        window.location.href = "dashboard.html"
    }
})

function showMessage(text, bootstrapColorClass) {
    messageDiv.innerText = text;
    messageDiv.className = `text-center small mt-3 fw-medium ${bootstrapColorClass}`
}