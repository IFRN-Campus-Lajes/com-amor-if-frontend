import { render, screen } from "@testing-library/react";
import PointSchoolClassCell from "../PointSchoolClassCell";

describe("PointSchoolClassCell", () => {
  it("mostra a turma diretamente em um lançamento individual", () => {
    render(
      <PointSchoolClassCell
        point={{ collective: false, turma: { nome: "1º A" } }}
      />
    );

    expect(screen.getByText("1º A")).toBeInTheDocument();
    expect(document.querySelector("details")).not.toBeInTheDocument();
  });

  it("resume o lançamento coletivo por turno e lista as turmas em uma sanfona", () => {
    render(
      <PointSchoolClassCell
        point={{
          collective: true,
          turno: 1,
          schoolClasses: [{ nome: "2º A" }, { nome: "2º B" }],
        }}
      />
    );

    expect(screen.getByText("Coletiva • Vespertino")).toBeInTheDocument();
    expect(screen.getByLabelText(/exibir 2 turmas/i)).toBeInTheDocument();
    expect(screen.getByText("2º A")).toBeInTheDocument();
    expect(screen.getByText("2º B")).toBeInTheDocument();
    expect(document.querySelector("details")).toBeInTheDocument();
  });
});
