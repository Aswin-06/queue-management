import Sidebar from "./Sidebar";
import {useAuth} from "../context/AuthContext"
import { useState } from "react";
function LandingPage()
{
    const {user, role, loading}=useAuth();
    return(
        <Sidebar role={role}/>
    )
}

export default LandingPage;