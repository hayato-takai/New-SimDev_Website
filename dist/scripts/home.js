  const mainVideo = document.getElementById("mainVideo");
    const buttons = document.querySelectorAll(".video-button");
    let currentIndex = 0;
    let progressInterval;

    // --- Function: Load and play a specific video ---
    function loadVideo(index) {
      clearInterval(progressInterval);
      buttons.forEach((btn, i) => {
        btn.classList.toggle("active", i === index);
        btn.querySelector(".progress-bar").style.width = "0%";
      });

      currentIndex = index;
      mainVideo.src = buttons[index].dataset.video;
      mainVideo.play();

      startProgress();
    }

    // --- Function: Animate progress bar smoothly ---
    function startProgress() {
      const activeBtn = buttons[currentIndex];
      const progressBar = activeBtn.querySelector(".progress-bar");

      progressInterval = setInterval(() => {
        if (mainVideo.duration) {
          const progress = (mainVideo.currentTime / mainVideo.duration) * 100;
          progressBar.style.width = progress + "%";
        }
      }, 100); // smooth updates
    }

    // --- Move to next video automatically ---
    mainVideo.addEventListener("ended", () => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= buttons.length) nextIndex = 0; // loop back
      loadVideo(nextIndex);
    });

    // --- Handle manual video selection ---
    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => loadVideo(i));
    });

    // Start first video progress
    startProgress();

    // window.addEventListener("load", () => {
    //   const loader = document.getElementById("loading-screen");
    //   const body = document.body;

    //   // Ensure loader starts visible until fully loaded
    //   loader.style.display = "flex";
    //   loader.classList.add("fade-out");
    //   loader.style.opacity = "1";

    //   // After load, fade out once
    //   setTimeout(() => {
    //     loader.classList.add("fade-out");
    //     setTimeout(() => {
    //       loader.style.display = "none";
    //     }, 1000);
    //   }, 300);

    //   // Mark the page as loaded
    //   body.classList.add("page-loaded");
    // });

    // document.addEventListener("DOMContentLoaded", () => {
    //   const links = document.querySelectorAll("a[href]");

    //   links.forEach(link => {
    //     if (link.target === "_blank" || link.href.includes("#")) return;

    //     link.addEventListener("click", event => {
    //       event.preventDefault();
    //       const href = link.getAttribute("href");
    //       const loader = document.getElementById("loading-screen");
    //       const body = document.body;

    //       // Only trigger loader if it's currently hidden (prevents double-fade)
    //       if (loader.classList.contains("fade-out")) {
    //         loader.style.display = "flex";
    //         setTimeout(() => {
    //           loader.classList.remove("fade-out");
    //         }, 10); // small delay to trigger transition properly
    //       }

    //       // Fade out the page content
    //       body.classList.remove("page-loaded");

    //       // Navigate after short delay
    //       setTimeout(() => {
    //         window.location.href = href;
    //       }, 800);
    //     });
    //   });
    // });

     const slides = document.querySelectorAll('.slide');
        const sidebuttons = document.querySelectorAll('.nav-btn');
        const leftArrow = document.querySelector('.arrow.left');
        const rightArrow = document.querySelector('.arrow.right');

        let index = 0;
        let animating = false;

        const slideDelay = 500;
        const slideDuration = 700;
        const expandDuration = 500;
        const inactiveHeight = 50;
        const expandedWidth = 420;

        function measureExpandedHeight(btn) {
            const clone = btn.cloneNode(true);
            clone.style.width = expandedWidth + 'px';
            clone.style.position = 'absolute';
            clone.style.visibility = 'hidden';
            clone.style.pointerEvents = 'none';
            clone.style.height = 'auto';
            clone.style.transition = 'none';
            document.body.appendChild(clone);
            const height = clone.scrollHeight + 6;
            clone.remove();
            return height;
        }

        function adjustButtonHeight() {
            sidebuttons.forEach(btn => {
                const desc = btn.querySelector('.desc');
                if (btn.classList.contains('active')) {
                    const fullHeight = measureExpandedHeight(btn);
                    btn.style.height = fullHeight + 'px';
                } else {
                    btn.style.height = inactiveHeight + 'px';
                    desc.style.opacity = 0;
                }
            });
        }

        function showSlide(newIndex) {
            if (animating || newIndex === index) return;
            animating = true;

            const currentSlide = slides[index];
            const nextSlide = slides[newIndex];
            const currentVideo = currentSlide.querySelector('video');
            const nextVideo = nextSlide.querySelector('video');

            // Stop and reset current video
            currentVideo.pause();
            currentVideo.currentTime = 0;

            currentSlide.classList.add('exit-left');
            currentSlide.classList.remove('active');

            setTimeout(() => {
                currentSlide.classList.remove('exit-left');
                nextSlide.classList.add('enter-right');
                nextSlide.style.transition = 'none';
                nextSlide.classList.add('active');
                void nextSlide.offsetWidth;
                nextSlide.style.transition = '';
                nextSlide.classList.remove('enter-right');

                // Restart next video
                nextVideo.currentTime = 0;
                nextVideo.play();

                setTimeout(() => {
                    index = newIndex;
                    animating = false;
                }, slideDuration);
            }, slideDelay);

            sidebuttons.forEach((btn, i) => {
                const desc = btn.querySelector('.desc');
                btn.classList.toggle('active', i === newIndex);
                if (i !== newIndex) desc.style.opacity = 0;
            });

            adjustButtonHeight();

  const activeDesc = sidebuttons[newIndex].querySelector('.desc');
  setTimeout(() => {
    activeDesc.style.opacity = 0.9;
  }, expandDuration);
        }

        sidebuttons.forEach(btn => btn.addEventListener('click', () => showSlide(parseInt(btn.dataset.index))));
        leftArrow.addEventListener('click', () => showSlide((index - 1 + slides.length) % slides.length));
        rightArrow.addEventListener('click', () => showSlide((index + 1) % slides.length));

        window.addEventListener('load', () => {
            sidebuttons.forEach(btn => btn.classList.remove('active'));
            slides.forEach(slide => slide.classList.remove('active'));
            sidebuttons[0].classList.add('active');
            slides[0].classList.add('active');
            const firstDesc = sidebuttons[0].querySelector('.desc');
            firstDesc.style.opacity = 0.9;
            requestAnimationFrame(() => setTimeout(adjustButtonHeight, 150));
        });

        window.addEventListener('resize', adjustButtonHeight);


// // PARALAX SECTION

// gsap.utils.toArray(".paralax-wrapper").forEach(section => {
// const image1 = document.querySelector(".paralax-first-img");
// const image2 = document.querySelector(".paralax-second-img");
//   const text1 = section.querySelector(".paralax-first-text");
//   const text2 = section.querySelector(".paralax-second-text");

//   const tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: section,
//       start: "center center",
//       // end: () => "+=" + section.offsetWidth * 2,
//       // end: () => "+=" + section.offsetHeight,
//       // end: "bottom bottom",

//       end: () => "+=1200",
//       scrub: 2,
//       // pin: true,
//       pin: ".paralax-left",
//       pinSpacing:true,
//       anticipatePin: 1,
//     },
//     defaults: { ease: "none" }
//   });

//   tl
//     .fromTo([image1, image2], { yPercent: 30 }, { yPercent: 10 })
//     .to({}, { duration: 0.5 })
//     .to(image1, { yPercent: -30 })
//     .fromTo(text1, { xPercent: 100 }, { xPercent: 0 }, "<")

//     // HOLD
//     .to({}, { duration: 0.5 })
//     .set(text2, { opacity: 1 })

//     // TEXT 1 OUT
//     .to(text1, { xPercent: 100 })
//     .to(image1, { yPercent: -200 }, "<")
//     .to(image2, { yPercent: -100 }, "<")
//     .fromTo(text2, { xPercent: 100 }, { xPercent: 0 }, "<")

//     // HOLD
//     .to({}, { duration: 0.5 })

//     // TEXT 2 OUT
//           .to(image2, { yPercent: -200 })

//     .to(text2, { xPercent: 100 }, "<");
// });


  

  // gsap.registerPlugin(ScrollTrigger);

  // const image1 = document.querySelector(".image1");
  // const image2 = document.querySelector(".image2");
  // const text1 = document.querySelector(".first-text");
  // const text2 = document.querySelector(".second-text");

  // // Timeline 1 — plays instantly (scrub: 0)
  // const tlInstant = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: ".scroll-instant",
  //     start: "top bottom",
  //     end: "top center",
  //     scrub: true, // no scrub (plays immediately as triggered)
  //           pin: false,
  //     anticipatePin: 0,
  // onEnter: () => console.log("Timeline 1 (Instant) started"),
  // onLeave: () => console.log("Timeline 1 (Instant) ended"),
  // onEnterBack: () => console.log("entering back"),
  // onLeaveBack: () => console.log("Timeline 1 reversed"),
  //   },
  //   defaults: { ease: "power1.out", duration: 0.1 }
  // });

  // tlInstant
  
  //       .to([image1, image2], { y: "0%" }, 0)

  //   .to([text1,text2], { y: "-100%" }, "<")
  //   .to([text1,text2] ,{ x: "+100%" }, "<")
  //       .to([image1, image2], { y: "-50%" });



  // Timeline 2 — continues with smooth scrub (scrub: 0.6)
  // const tlSmooth = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: ".scroll-space",
  //     start: "top bottom-=200", // begins after first sequence
  //     end: "bottom bottom-=800",
  //     scrub: 0.9,
  //     pin: false,
  //     anticipatePin: 1,
  // onEnter: () => console.log("Timeline 2 (Instant) started"),
  // onLeave: () => console.log("Timeline 2 (Instant) ended"),
  // onEnterBack: () => console.log("entering back"),
  // onLeaveBack: () => console.log("Timeline 2 reversed"),
  //   },
  //   defaults: { ease: "power1.out", duration: 2 }
  // });

  // tlSmooth
  //   .to([image1, image2], { y: "-30%" }, 0)

  //    .to(image1, { y: "-60%" }, "+=0.5")
  //   .to(text1, { x: "-120%" }, "<")
  //   //  .to(image2, { y: "-50%" }, "<")

  //    .to(image1, { y: "-160%" }, "+=2")
  //    .to(image2, { y: "-120%" }, "<")
  //        .to(text1, { x: "+120%" }, "<")
  //    .to(text2, { x: "-120%" }, "<")

  //     .to(image2, { y: "-160%" }, "+=1.5")
  //          .to(text2, { x: "+120%" }, "<");