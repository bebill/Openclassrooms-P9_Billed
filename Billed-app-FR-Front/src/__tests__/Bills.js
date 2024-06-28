/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByTestId('bill-date')
        .filter(el => /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/.test(el.getAttribute('data-date')))
        .map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    });

    test("Then title and newBill button should be display", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
    });

    describe("When I click on the New Bill button", () => {
      test("Then I should be redirected to the New Bill page", async () => {
        document.body.innerHTML = BillsUI({ data: bills })

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleClickNewBill = jest.fn(() => billsContainer.handleClickNewBill())

        const newBillButton = screen.getByTestId('btn-new-bill')
        newBillButton.addEventListener('click', handleClickNewBill)
        userEvent.click(newBillButton)

        expect(handleClickNewBill).toHaveBeenCalled()
        await waitFor(() => screen.getByTestId("form-new-bill"))
        expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()
      })
    });

    describe("When I click on the icon eye", () => {
      test('Then a modal should open', () => {
        document.body.innerHTML = BillsUI({ data: bills })

        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const iconEye = screen.getAllByTestId('icon-eye')[0]
        $.fn.modal = jest.fn()
        const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(iconEye))

        iconEye.addEventListener('click', handleClickIconEye)
        iconEye.click()

        expect(handleClickIconEye).toHaveBeenCalled()
      });

      test('Then the modal should display the attached image', () => {
        document.body.innerHTML = BillsUI({ data: bills })

        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const iconEye = screen.getAllByTestId('icon-eye')[0]
        billsContainer.handleClickIconEye(iconEye)

        expect(screen.getByTestId('modal-img')).toBeTruthy()
      });
    });

    describe("When an error occurs while getting bills", () => {
      test("Then it should log the error and return unformatted date and status", async () => {
        // Simulate corrupted data scenario
        const corruptedBills = [
          {
            id: "47qAXb6fIm2zOKkLzMro",
            vat: "80",
            fileUrl: "https://test.storage.tld/v0/b/ocean-677b6.appspot.com/o/bills%2F47qAXb6fIm2zOKkLzMro?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
            status: "accepted",
            type: "Hôtel et logement",
            commentary: "séminaire billed",
            name: "encore",
            fileName: "preview-facture-free-201801-pdf-1.jpg",
            date: "invalid date",
            amount: 400,
            commentAdmin: "ok"
          }
        ]

        mockStore.bills = jest.fn(() => {
          return {
            list: jest.fn(() => {
              return Promise.resolve(corruptedBills)
            })
          }
        })

        const consoleSpy = jest.spyOn(console, 'log')

        const billsContainer = new Bills({
          document,
          onNavigate: () => { },
          store: mockStore,
          localStorage: window.localStorage
        })

        const billsList = await billsContainer.getBills()

        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error), 'for', corruptedBills[0])
        expect(billsList[0].date).toBe(corruptedBills[0].date)
        expect(billsList[0].status).toBe(corruptedBills[0].status)
      })
    });

    describe("When store is null", () => {
      test("Then it should log a warning and return an empty array", async () => {
        console.warn = jest.fn();
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage,
        });

        const bills = await billsContainer.getBills();

        // Ensure warning is logged and getBills returns an empty array
        expect(console.warn).toHaveBeenCalledWith('Store is not available');
        expect(bills).toEqual([]);
      });
    });
  });
})
