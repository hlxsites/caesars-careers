export default function decorate(block) {
  const iconBlockChildren = [...block.children];
  if(!iconBlockChildren || iconBlockChildren.length < 1) return;

  const initialIconsDiv = iconBlockChildren[0];
  if(!initialIconsDiv
    || !initialIconsDiv.children
    || initialIconsDiv.children.length < 1) {
    return;
  }

  const allIcons = initialIconsDiv.children[0];
  const iconNodes = [];
  let currentIconNode = null;
  [...allIcons.children].forEach((iconLayoutElement) => {
    // check if current element is an icon or not

    const hasIconSvg = iconLayoutElement.querySelector('svg');
    if(hasIconSvg){
      // new icon node, add previous icon to list, create new icon node
      iconLayoutElement.classList.add('icon-layout-picture');
      if(!!currentIconNode){
        iconNodes.push(currentIconNode);
      }

      currentIconNode = document.createElement('div');
      currentIconNode.classList.add('icon-layout-element');
      currentIconNode.append(iconLayoutElement);
    } else {
      // if not icon, add content as is to currently built icon node
      currentIconNode.append(iconLayoutElement);
    }

  });

  // handle last icon node, if any, since we may go out of the loop before adding it
  if(!!currentIconNode){
    iconNodes.push(currentIconNode);
    currentIconNode = null;
  }

  initialIconsDiv.remove();
  block.append(...iconNodes);
}