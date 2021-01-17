// Import stylesheets
import "./style.css";

("use strict");

// SVG's

const activeSVG = `<svg aria-hidden="true" data-reactid="281" fill="none" height="24" stroke="white"
								stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"
								width="24" xmlns="http://www.w3.org/2000/svg">
								<polyline points="18 15 12 9 6 15">
								</polyline>
							</svg>`;

const inactiveSVG = `<svg aria-hidden="true" class="" data-reactid="266" fill="none" height="24" stroke="#606F7B"
								stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewbox="0 0 24 24"
								width="24" xmlns="http://www.w3.org/2000/svg">
								<polyline points="6 9 12 15 18 9">
								</polyline>
							</svg>`;

//Getting refference

const dropBtns = Array.from(document.querySelectorAll(".showContentBtn"));
const interActiveHeaders = Array.from(
  document.querySelectorAll(".interactiveHeader")
);
const expandableItems = Array.from(document.querySelectorAll(".accordionItem"));

// Bug preventing app state obj

const state = {
  animationInProgress: false
};

// Utility functions

function getMinWrapperHeight(expandableItems) {
  const allItems = [...expandableItems];

  const highestContentDiv = allItems
    .map(item => {
      return item.getBoundingClientRect().height;
    })
    .sort((a, b) => a < b)[0];

  return expandableItems.reduce(
    (acc, item) =>
      (acc += item.querySelector("header").getBoundingClientRect().height),
    highestContentDiv
  );
}

function getContentElementsHeights(expandableItems) {
  expandableItems.forEach(item => {
    const contentToExpand = item.querySelector(".accordionItemContent");
    const contentHeight = contentToExpand.getBoundingClientRect().height;
    item.setAttribute("content-height", contentHeight);
    contentToExpand.style.display = "none";
  });
}

function getAllExpandablesBelow(currentElement, allExpandables) {
  return allExpandables.filter(expandable => {
    return currentElement.getBoundingClientRect().y <
      expandable.getBoundingClientRect().y
      ? expandable
      : false;
  });
}

// Template element

const templateElt = document.createElement("div");
templateElt.className = "border-l border-indigo text-grey-darkest contentDiv";

// Expanding function deffo could use refactoring

function toggleExpand(event) {
  if (state.animationInProgress) {
    return;
  }
  state.animationInProgress = !state.animationInProgress;

  const previouslyActivated = expandableItems.find(item => {
    return item.classList.contains("active");
  });

  let usedBtn = event.currentTarget;

  if (event.currentTarget.tagName === "DIV") usedBtn = event.currentTarget;

  if (event.currentTarget.tagName === "SPAN")
    usedBtn = event.currentTarget.nextElementSibling;

  const currentExpandableItem =
    usedBtn.parentElement.parentElement.parentElement;

  //If none was active

  if (!previouslyActivated) {
    const currentCollapsedContent = currentExpandableItem.getAttribute(
      "content-height"
    );

    const currentContentElement = appendExpandableContainer(
      currentExpandableItem,
      templateElt
    );

    const contentEltDesiredScale =
      currentCollapsedContent /
      currentContentElement.getBoundingClientRect().height;

    const unactiveEltsTranslateAmount = 10 * contentEltDesiredScale;

    const expandablesBelowCurrent = getAllExpandablesBelow(
      currentExpandableItem,
      expandableItems
    );

    currentExpandableItem.classList.add("active");
    currentExpandableItem.querySelector("svg").innerHTML = activeSVG;

    currentContentElement.style.transformOrigin = "top";

    currentContentElement.style.transform = `scaleY(${contentEltDesiredScale})`;

    expandablesBelowCurrent.forEach(elt => {
      elt.style.transform = `translateY(${unactiveEltsTranslateAmount +
        0.04 * unactiveEltsTranslateAmount}px)`;
    });

    currentContentElement.addEventListener(
      "transitionend",
      event => {
        showContent(event, currentExpandableItem, contentEltDesiredScale);
      },
      { once: true }
    );

    return;
  }

  // Runs if current was previously active

  if (previouslyActivated === currentExpandableItem) {
    const currentCollapsedContent = currentExpandableItem.getAttribute(
      "content-height"
    );

    const currentContentElement = appendExpandableContainer(
      currentExpandableItem,
      templateElt
    );

    const contentEltDesiredScale =
      currentCollapsedContent /
      currentContentElement.getBoundingClientRect().height;

    const unactiveEltsTranslateAmount = 10 * contentEltDesiredScale - 10;

    const expandablesBelowCurrent = getAllExpandablesBelow(
      currentExpandableItem,
      expandableItems
    );

    hideContent(previouslyActivated);

    previouslyActivated.nextElementSibling.addEventListener(
      "deactivateIt",
      () => {
        expandablesBelowCurrent.forEach(elt => {
          elt.style.transform = `translateY(-${unactiveEltsTranslateAmount}px)`;
        });
        previouslyActivated.classList.remove("active");
        previouslyActivated.querySelector("svg").innerHTML = inactiveSVG;

        state.animationInProgress = !state.animationInProgress;
      },
      { once: true }
    );

    return;
  }

  //Runs if some other was previously active

  if (previouslyActivated && previouslyActivated !== currentExpandableItem) {
    const currentExpandedContent = previouslyActivated.getAttribute(
      "content-height"
    );

    const previousContentElement = appendExpandableContainer(
      previouslyActivated,
      templateElt
    );

    const previousContentScale =
      currentExpandedContent /
      previousContentElement.getBoundingClientRect().height;

    const activeEltTranslateAmount = 10 * previousContentScale - 10;

    const expandablesBelowPrevious = getAllExpandablesBelow(
      previouslyActivated,
      expandableItems
    );

    hideContent(previouslyActivated);

    previouslyActivated.nextElementSibling.addEventListener(
      "deactivateIt",
      e => {
        if (expandablesBelowPrevious.length > 0) {
          expandablesBelowPrevious[0].addEventListener(
            "transitionend",
            () => {
              state.animationInProgress = !state.animationInProgress;
              usedBtn.click();
            },
            { once: true }
          );
          expandablesBelowPrevious.forEach(elt => {
            elt.style.transform = `translateY(-${activeEltTranslateAmount}px)`;
          });

          previouslyActivated.classList.remove("active");
          previouslyActivated.querySelector("svg").innerHTML = inactiveSVG;
        } else {
          const targetNode = document.querySelector("main");
          const config = { childList: true };

          function clickBtn() {
            previouslyActivated.querySelector("svg").innerHTML = inactiveSVG;
            previouslyActivated.classList.remove("active");

            state.animationInProgress = !state.animationInProgress;

            usedBtn.click();
            observer.disconnect();
          }

          const observer = new MutationObserver(clickBtn);

          observer.observe(targetNode, config);
        }
      },
      { once: true }
    );

    return;
  }

  //Runs if none active
}

function appendExpandableContainer(expandableItem, element) {
  expandableItem.insertAdjacentElement("afterend", element);

  return element;
}

function showContent(event, currentExpandableItem, contentEltDesiredScale) {
  const containerYPosition = event.currentTarget.getBoundingClientRect().y;

  const content = currentExpandableItem.querySelector(".accordionItemContent");

  event.currentTarget.appendChild(content);

  content.style.transform = `scaleY(${1 / contentEltDesiredScale})`;

  content.style.opacity = "0";

  content.style.display = "block";

  const afterappendContentLocation = content.getBoundingClientRect().y;

  const contentTranslateY = afterappendContentLocation - containerYPosition;

  content.style.transform = `scaleY(${1 /
    contentEltDesiredScale}) translateY(-${contentTranslateY - 5}px)`;

  content.style.opacity = "1";
  state.animationInProgress = !state.animationInProgress;
}

function hideContent(activeExpandableItem) {
  const activeContainer = activeExpandableItem.nextElementSibling;

  const contentToHide = activeContainer.querySelector(".accordionItemContent");
  contentToHide.style.opacity = "0";

  contentToHide.addEventListener(
    "transitionend",
    event1 => {
      event1.stopPropagation();

      contentToHide.style.transform = "scaleY(1)";
      contentToHide.style.display = "none";
      const originalContainer = activeExpandableItem.querySelector(
        ".accordionContentWrapper"
      );

      originalContainer.appendChild(contentToHide);
      activeContainer.addEventListener(
        "transitionend",
        () => {
          activeContainer.dispatchEvent(new CustomEvent("deactivateIt"));

          document.querySelector("main").removeChild(activeContainer);
        },
        { once: true }
      );

      shrinkDownActiveContainer(activeExpandableItem);
    },
    { once: true }
  );
}

function shrinkDownActiveContainer(activeExpandableItem) {
  const activeContainer = activeExpandableItem.nextElementSibling;

  activeContainer.style.transform = "scaleY(1)";
}
//Entry point

document.querySelector("main").style.minHeight = `${getMinWrapperHeight(
  expandableItems
)}px`;

getContentElementsHeights(expandableItems);

dropBtns.forEach(btn => {
  btn.addEventListener("click", toggleExpand);
});

interActiveHeaders.forEach(header => {
  header.addEventListener("dblclick", toggleExpand);
});
