export class Pin {
  static {}
}

function createSvg() {
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgEl.setAttribute('width', '26');
  svgEl.setAttribute('height', '37');
  svgEl.setAttribute('viewBox', '0 0 26 37');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="37" viewBox="0 0 26 37">
      <g fill="none" fill-rule="evenodd">
        <path class="pin-outer" fill="#C5221F" d="M13 0C5.8175 0 0 5.77328 0 12.9181C0 20.5733 5.59 23.444 9.55499 30.0784C12.09 34.3207 11.3425 37 13 37C14.7225 37 13.975 34.2569 16.445 30.1422C20.085 23.8586 26 20.6052 26 12.9181C26 5.77328 20.1825 0 13 0Z"></path>
        <path class="pin-inner" fill="#EA4335" d="M13.0167 35C12.7836 35 12.7171 34.9346 12.3176 33.725C11.9848 32.6789 11.4854 31.0769 10.1873 29.1154C8.92233 27.1866 7.59085 25.6173 6.32594 24.1135C3.36339 20.5174 1 17.7057 1 12.6385C1.03329 6.19808 6.39251 1 13.0167 1C19.6408 1 25 6.23078 25 12.6385C25 17.7057 22.6699 20.55 19.6741 24.1462C18.4425 25.65 17.1443 27.2193 15.8793 29.1154C14.6144 31.0442 14.0818 32.6135 13.749 33.6596C13.3495 34.9346 13.2497 35 13.0167 35Z"></path>
        <path class="pin-dot" fill="#B31412" d="M13 18C15.7614 18 18 15.7614 18 13C18 10.2386 15.7614 8 13 8C10.2386 8 8 10.2386 8 13C8 15.7614 10.2386 18 13 18Z"></path>
      </g>    
    </svg>
  `;

  const p = new DOMParser();

  const groupEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  groupEl.setAttribute('fill', 'none');
  groupEl.setAttribute('fill-rule', 'evenodd');
  svgEl.appendChild(groupEl);

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  path1.setAttribute(
    'd',
    'M13 0C5.8175 0 0 5.77328 0 12.9181C0 20.5733 5.59 23.444 9.55499 30.0784C12.09 34.3207 11.3425 37 13 37C14.7225 37 13.975 34.2569 16.445 30.1422C20.085 23.8586 26 20.6052 26 12.9181C26 5.77328 20.1825 0 13 0Z'
  );
  path1.setAttribute('fill', '#C5221F');

  path2.setAttribute(
    'd',
    'M13.0167 35C12.7836 35 12.7171 34.9346 12.3176 33.725C11.9848 32.6789 11.4854 31.0769 10.1873 29.1154C8.92233 27.1866 7.59085 25.6173 6.32594 24.1135C3.36339 20.5174 1 17.7057 1 12.6385C1.03329 6.19808 6.39251 1 13.0167 1C19.6408 1 25 6.23078 25 12.6385C25 17.7057 22.6699 20.55 19.6741 24.1462C18.4425 25.65 17.1443 27.2193 15.8793 29.1154C14.6144 31.0442 14.0818 32.6135 13.749 33.6596C13.3495 34.9346 13.2497 35 13.0167 35Z'
  );
  path2.setAttribute('fill', '#EA4335');

  path3.setAttribute(
    'd',
    'M13 18C15.7614 18 18 15.7614 18 13C18 10.2386 15.7614 8 13 8C10.2386 8 8 10.2386 8 13C8 15.7614 10.2386 18 13 18Z'
  );
  path3.setAttribute('fill', '#B31412');

  groupEl.append(path1, path2, path3);

  return svgEl;
}
