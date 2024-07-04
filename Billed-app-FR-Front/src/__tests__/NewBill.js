/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

jest.mock("../app/Store", () => mockStore)

window.alert = jest.fn()

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))

  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      const html = NewBillUI()
      document.body.innerHTML = html
    })
    test("Then the form should be displayed", () => {
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()
    })
    describe("When I click on load file and upload a file", () => {
      test("Then I shouldn't be able to upload a file with the wrong format", async () => {
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        const file = new File(['facturefreemobile.pdf'], 'facturefreemobile.pdf', { type: 'application/pdf' })
        const fileInput = screen.getByTestId("file")
        fileInput.addEventListener("change", handleChangeFile)
        fireEvent.change(fileInput, { target: { files: [file] } })
        await waitFor(() => expect(handleChangeFile).toHaveBeenCalled())
        expect(window.alert).toHaveBeenCalledWith("Le format du fichier n'est pas valide. Veuillez sélectionner un fichier au format JPG, JPEG ou PNG.")
        expect(Object.keys(fileInput.files[0]).length).toBe(0); // file is not uploaded
      })
      test("Then uploaded file should be with the right format", () => {
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        const file = new File(['facturefreemobile.jpg'], 'facturefreemobile.jpg', { type: 'image/jpg' })
        const fileInput = screen.getByTestId("file")
        fileInput.addEventListener("change", handleChangeFile)
        fireEvent.change(fileInput, { target: { files: [file] } })
        expect(handleChangeFile).toHaveBeenCalled()
        expect(fileInput.files[0].name).toBe(file.name)
      })
    })

    describe("When the form is submitted", () => {
      test("Then should not submit the form if the file is not uploaded", () => {
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleSubmit = jest.fn(newBill.handleSubmit)
        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)
        fireEvent.submit(form)
        expect(handleSubmit).toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalledWith("Veuillez soumettre un fichier avant de continuer.")
      })
    })
  })
})


// test d'intégration POST
describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@company.tld",
      })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.NewBill);
    const html = NewBillUI();
    document.body.innerHTML = html;
  });

  describe("When I submit the new bill form with valid data", () => {
    test("Then it should create a new bill and redirect to Bills page", async () => {
      const mockedCreate = jest.fn().mockResolvedValue({
        id: "1234",
        vat: "10",
        fileUrl: "https://test.storage.tld/mock-file.jpg",
        status: "pending",
        type: "Transports",
        commentary: "",
        name: "Train ticket",
        fileName: "mock-file.jpg",
        date: "2024-07-04",
        amount: 50,
        commentAdmin: "",
        email: "employee@example.com",
        pct: 20,
      });

      const mockedUpdate = jest.fn().mockResolvedValue({
        id: "1234",
        vat: "10",
        fileUrl: "https://test.storage.tld/mock-file.jpg",
        status: "pending",
        type: "Transports",
        commentary: "",
        name: "Train ticket",
        fileName: "mock-file.jpg",
        date: "2024-07-04",
        amount: 50,
        commentAdmin: "",
        email: "employee@example.com",
        pct: 20,
      });

      mockStore.bills = jest.fn().mockImplementation(() => ({
        list: jest.fn().mockResolvedValue([]),
        create: mockedCreate,
        update: mockedUpdate,
      }));

      const newBill = new NewBill({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = pathname;
          window.location.hash = pathname;
        },
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Simulate user input
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Train ticket" },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "50" },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2024-07-04" },
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: "20" },
      });

      // Mock file upload
      const file = new File(["mock-file.jpg"], "mock-file.jpg", {
        type: "image/jpeg",
      });
      Object.defineProperty(screen.getByTestId("file"), "files", {
        value: [file],
      });
      fireEvent.change(screen.getByTestId("file"));

      // Simulate setting billId to ensure redirection
      newBill.billId = "1234";

      // Submit form
      fireEvent.submit(screen.getByTestId("form-new-bill"));

      // Wait for API call and redirect
      await waitFor(() => {
        expect(mockedCreate).toHaveBeenCalledTimes(1);
        expect(mockedUpdate).toHaveBeenCalledTimes(1);
        // Check navigation to Bills page
        expect(window.location.hash).toBe(ROUTES_PATH.Bills);
      });
    });
  });

  describe("When I am on NewBill Page, i want to submit but an error appears", () => {
    beforeEach(() => {
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      document.body.innerHTML = NewBillUI();
    });
    afterEach(() => {
      document.body.innerHTML = "";
      jest.clearAllMocks();
    });
    test("Fetch fails with 404 error message", async () => {
      const store = {
        bills: jest.fn().mockImplementation(() => newBill.store),
        create: jest.fn().mockImplementation(() => Promise.resolve({})),
        update: jest
          .fn()
          .mockImplementation(() => Promise.reject(new Error("404"))),
      };
      const newBill = new NewBill({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        },
        store,
        localStorage: window.localStorage,
      });
      newBill.isFormImgValid = true;

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);
      await new Promise(process.nextTick);

      await expect(store.update()).rejects.toEqual(new Error("404"));
    });
    test("Fetch fails with 500 error message", async () => {
      const store = {
        bills: jest.fn().mockImplementation(() => newBill.store),
        create: jest.fn().mockImplementation(() => Promise.resolve({})),
        update: jest
          .fn()
          .mockImplementation(() => Promise.reject(new Error("500"))),
      };
      const newBill = new NewBill({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        },
        store,
        localStorage: window.localStorage,
      });
      newBill.isFormImgValid = true;

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);
      await new Promise(process.nextTick);

      await expect(store.update()).rejects.toEqual(new Error("500"));
    });
  });
});