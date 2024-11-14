import { useState } from "react";
import Swal from "sweetalert2";
import config from "./config";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function App() {
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const navigate = useNavigate();

  const handleSingIn = async () => {
    try {
      const payload = {
        usr: usr,
        pwd: pwd,
      };
      await axios
        .post(config.api_path + "/admin/signin", payload)
        .then((res) => {
          if (res.data.message === "success") {
            localStorage.setItem(config.token_name, res.data.token);
            navigate("/home");
          }
        })
        .catch((err) => {
          throw err.response.data;
        });
    } catch (e) {
      if (e.response != undefined && e.response.status != undefined) {
        if (e.response.status == 401) {
          Swal.fire({
            title: "Sing In",
            text: "username หรือ password ไม่ถูกต้อง",
            icon: "error",
          });
        }
      } else {
        Swal.fire({
          title: "error",
          text: e.message,
          icon: "error",
        });
      }
    }
  };

  return (
    <div className="mt-5 ms-5 me-5 mb-5">
      <div className="card">
        <div className="card-header">
          <div className="h5">Sign in to BackOffice</div>
        </div>
        <div className="card-body">
          <div>Username</div>
          <div>
            <input
              onChange={(e) => setUsr(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="mt-3">
            <div>Password</div>
            <div>
              <input
                onChange={(e) => setPwd(e.target.value)}
                className="form-control"
                type="password"
              />
            </div>
          </div>

          <div className="mt-3">
            <button onClick={handleSingIn} className="btn btn-primary">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
